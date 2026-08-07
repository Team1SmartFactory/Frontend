import { Emitter } from '../utils/emitter';
import type { RealtimeMessage } from '../domain/schemas';
import {
  DEFAULT_PERMISSIONS,
  type Camera,
  type DetectionFeedbackInput,
  type InventoryPoint,
  type Line,
  type Permissions,
  type Position,
  type RobotStatus,
  type ShortageEvent,
  type StockVerdict,
} from '../domain/types';
import type { Snapshot } from '../domain/schemas';

/**
 * 실제 백엔드(FastAPI + MQTT Broker + PostgreSQL)가 없는 상태에서도
 * 대시보드 MVP를 그대로 시연할 수 있도록, 설계 문서의 5단계 프레임워크를
 * 브라우저 메모리 안에서 흉내내는 시뮬레이터.
 *
 * FactoryApi/RealtimeClient 계약을 그대로 따르므로, 실제 백엔드가 준비되면
 * .env의 VITE_USE_MOCK=false 한 줄로 전환되고 이 파일 전체를 걷어낼 수 있다.
 */

const TICK_MS = 1200;
const SHORTAGE_THRESHOLD = 20;
const STEP_TICKS = 3;
const MAX_HISTORY_POINTS = 30;

/**
 * 관리자가 "부족 아님"으로 판정했을 때 되돌릴 측정값 — 임계치의 3배.
 *
 * 관리자 판정은 비전 측정이 틀렸다는 뜻이므로, 플래그를 덧씌우는 대신
 * 측정값 자체를 바로잡는다. 그래야 화면(뱃지·LED·게이지)이 저절로 일치하고,
 * 이후의 감소 → 재감지 흐름도 자연스럽게 이어진다.
 * 3배로 잡은 것은 statusTone의 '정상' 구간(임계치 2.5배 초과)에 들기 위해서다.
 */
const CONFIRMED_NORMAL_MULTIPLIER = 3;

/** 보정 직후 다시 감소해 곧바로 재감지되는 것을 막는 유예 틱. */
const CORRECTION_COOLDOWN_TICKS = 5;

const PERMISSIONS_STORAGE_KEY = 'sfsc.settings.permissions';

type TaskStep = 'dispatch_storage' | 'beagle_to_line' | 'unload' | 'done';

interface ActiveTask {
  shortageEventId: string;
  lineId: string;
  step: TaskStep;
  progress: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * 좌표는 공장 도면(features/floorplan/floorPlanLayout.ts)의 구역 중심을
 * 0~100 상대 좌표로 옮긴 값이다. 도면 배치가 바뀌면 두 파일을 함께 고쳐야 한다.
 */
const STORAGE_POSITION: Position = { x: 21.8, y: 80.4 };

/** 보관소 OMX-F가 서 있는 자리. Beagle 대기 위치와 겹치지 않게 왼쪽에 둔다. */
const STORAGE_ARM_POSITION: Position = { x: 9.6, y: 80.4 };

/** Beagle이 도착하는 각 라인의 하역 지점 (도면상 구역 좌하단 통로). */
const LINE_POSITIONS: Record<string, Position> = {
  'line-a': { x: 12.0, y: 44.3 },
  'line-b': { x: 43.9, y: 44.3 },
  'line-c': { x: 71.8, y: 44.3 },
  'line-d': { x: 12.0, y: 72.2 },
  'line-e': { x: 43.9, y: 72.2 },
  'line-f': { x: 71.8, y: 72.2 },
};

/** 라인 OMX-F가 서 있는 자리. 하역 지점 바로 왼쪽. */
const LINE_ARM_POSITIONS: Record<string, Position> = {
  'line-a': { x: 6.9, y: 44.3 },
  'line-b': { x: 38.8, y: 44.3 },
  'line-c': { x: 66.7, y: 44.3 },
  'line-d': { x: 6.9, y: 72.2 },
  'line-e': { x: 38.8, y: 72.2 },
  'line-f': { x: 66.7, y: 72.2 },
};

/**
 * ─── 데모용 고정 고장 ────────────────────────────────────────────────
 *
 * 대시보드 알림 섹션(ExceptionFeed)이 잡는 네 신호를 목에서도 볼 수 있게,
 * 고장 난 장비를 처음부터 한 대씩 심어 둔다. 실제 백엔드가 붙으면 이 값들은
 * 그쪽이 내려주는 상태로 대체된다.
 *
 * 고장을 심을 대상은 작업 흐름이 건드리지 않는 장비로 고른다. advanceTask가
 * omxf-storage-1 / beagle-1 / omxf-<lineId>의 state를 working·idle로 덮어쓰기
 * 때문에, 이들에 고장을 심으면 첫 보충 작업이 지나가는 순간 지워진다.
 */
const FAULTY_CAMERA_ID = 'cam-line-c';
const STALLED_LINE_ID = 'line-f';

const INITIAL_QTY: Record<string, number> = {
  'line-a': 82,
  'line-b': 75,
  'line-c': 68,
  'line-d': 90,
  'line-e': 61,
  // 보충이 멈춘 라인이라 낮은 값에서 시작한다.
  'line-f': 12,
};

const INITIAL_LINES: Line[] = Object.entries(LINE_POSITIONS).map(([id, position]) => ({
  id,
  name: `${id.slice(-1).toUpperCase()}라인`,
  threshold: SHORTAGE_THRESHOLD,
  currentQty: INITIAL_QTY[id] ?? 80,
  /*
   * 멈춘 보충 건이 걸린 라인은 '보충 중'으로 시작한다.
   * decayRandomLine이 restocking 라인을 건너뛰므로 재고가 더 떨어지지 않고,
   * "지시는 나갔는데 진행이 없다"는 상태로 고정된다.
   */
  status: id === STALLED_LINE_ID ? 'restocking' : 'normal',
  updatedAt: nowIso(),
  position,
}));

/**
 * 보관소 OMX-F 1대 + Beagle 1대 + 라인별 OMX-F 6대.
 * 라인 하역 로봇은 `omxf-<lineId>` 규칙으로 id를 만들어,
 * 작업 진행 시 라인 id만으로 담당 로봇을 찾을 수 있게 한다.
 */
const INITIAL_ROBOTS: RobotStatus[] = [
  { robotId: 'omxf-storage-1', type: 'omxf_storage', state: 'idle', position: { ...STORAGE_ARM_POSITION }, updatedAt: nowIso() },
  { robotId: 'beagle-1', type: 'beagle', state: 'idle', position: { ...STORAGE_POSITION }, updatedAt: nowIso() },
  ...Object.entries(LINE_ARM_POSITIONS).map(([lineId, position]) => ({
    robotId: `omxf-${lineId}`,
    type: 'omxf_line' as const,
    state: 'idle' as const,
    position: { ...position },
    updatedAt: nowIso(),
  })),
  /*
   * 예비 장비 2대는 고장 상태로 둔다. 작업 흐름이 이 id들을 찾지 않으므로
   * 보충 작업이 몇 번 지나가도 상태가 덮이지 않는다 — 그래서 고정 고장이 된다.
   */
  {
    robotId: 'omxf-storage-2',
    type: 'omxf_storage',
    state: 'error',
    position: { ...STORAGE_ARM_POSITION },
    updatedAt: minutesAgoIso(42),
  },
  {
    robotId: 'beagle-2',
    type: 'beagle',
    state: 'offline',
    position: { ...STORAGE_POSITION },
    updatedAt: minutesAgoIso(180),
  },
];

const PART_NAMES = ['M6 볼트 세트', '베어링 유닛', '알루미늄 브래킷', '센서 하우징'];

const ACTIVE_SHORTAGE_STATUSES = new Set<ShortageEvent['status']>([
  'pending_approval',
  'dispatched',
  'in_transit',
]);

/** 공장 전체를 비추는 천장 카메라. 특정 라인에 속하지 않으므로 목록 맨 앞에 고정으로 둔다. */
const OVERVIEW_CAMERA: Camera = {
  id: 'cam-overview',
  scope: 'overview',
  label: '공장 전체 천장 카메라',
  online: true,
};

/** 전체 뷰 1대 + 라인당 천장 카메라 1대. 실제 백엔드에서는 카메라 테이블이 대신한다. */
const INITIAL_CAMERAS: Camera[] = [
  OVERVIEW_CAMERA,
  ...INITIAL_LINES.map((line) => ({
    id: `cam-${line.id}`,
    scope: 'line' as const,
    lineId: line.id,
    label: `${line.name} 천장 카메라`,
    // 한 대는 꺼져 있다. 이 라인은 승인 팝업에서 영상 없이 판단하게 되므로 알림 대상이다.
    online: `cam-${line.id}` !== FAULTY_CAMERA_ID,
  })),
];

/**
 * 15분째 끝나지 않는 보충 건.
 * activeTasks에 짝이 없으므로 step()이 진행시키지 않는다 — 운반 도중 로봇이
 * 멈춰 선 상황이 이렇게 보인다. 알림 섹션이 '보충 지연'으로 잡는다.
 */
const STALLED_EVENT: ShortageEvent = {
  id: 'shortage-stalled-demo',
  lineId: STALLED_LINE_ID,
  detectedAt: minutesAgoIso(16),
  status: 'in_transit',
  partName: '베어링 유닛',
  requiredQty: 24,
  approvedBy: 'admin',
  approvedAt: minutesAgoIso(15),
};

function readStoredPermissions(): Permissions {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    return raw
      ? { ...DEFAULT_PERMISSIONS, ...(JSON.parse(raw) as Partial<Permissions>) }
      : DEFAULT_PERMISSIONS;
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

class MockFactoryBackend {
  private lines = new Map<string, Line>(INITIAL_LINES.map((line) => [line.id, { ...line }]));
  private robots = new Map<string, RobotStatus>(INITIAL_ROBOTS.map((robot) => [robot.robotId, { ...robot }]));
  private shortageEvents = new Map<string, ShortageEvent>([
    [STALLED_EVENT.id, { ...STALLED_EVENT }],
  ]);
  private activeTasks = new Map<string, ActiveTask>();
  private cooldownUntilTick = new Map<string, number>();
  private cameras: Camera[] = INITIAL_CAMERAS.map((camera) => ({ ...camera }));
  private permissions: Permissions = readStoredPermissions();
  /** 라인별 재고 추이. 실제 백엔드에서는 시계열 테이블이 대신한다. */
  private inventoryHistory = new Map<string, InventoryPoint[]>();
  private emitter = new Emitter<RealtimeMessage>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tick = 0;

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.step(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(listener: (message: RealtimeMessage) => void): () => void {
    return this.emitter.on(listener);
  }

  getSnapshot(): Snapshot {
    return {
      lines: Array.from(this.lines.values()).map((line) => ({ ...line })),
      robots: Array.from(this.robots.values()).map((robot) => ({ ...robot })),
      shortageEvents: Array.from(this.shortageEvents.values()).map((event) => ({ ...event })),
    };
  }

  getCameras(): Camera[] {
    return this.cameras.map((camera) => ({ ...camera }));
  }

  getPermissions(): Permissions {
    return { ...this.permissions, authorizedApprovers: [...this.permissions.authorizedApprovers] };
  }

  setPermissions(permissions: Permissions): Permissions {
    this.permissions = permissions;
    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
    } catch {
      // 저장 실패는 세션 내 동작에 영향을 주지 않으므로 무시한다.
    }
    return this.getPermissions();
  }

  getInventoryHistory(lineId: string): InventoryPoint[] {
    return (this.inventoryHistory.get(lineId) ?? []).map((point) => ({ ...point }));
  }

  async approveShortage(id: string, approvedBy: string): Promise<ShortageEvent> {
    const event = this.shortageEvents.get(id);
    if (!event) throw new Error(`알 수 없는 부족 이벤트: ${id}`);

    const updated: ShortageEvent = { ...event, status: 'dispatched', approvedBy, approvedAt: nowIso() };
    this.shortageEvents.set(id, updated);
    this.emitShortage(updated);
    this.startReplenishment(updated);

    return updated;
  }

  /**
   * 반려 = "카메라로 봤더니 부족이 아니었다".
   *
   * 감지가 틀렸다는 판단이므로 측정값을 정상 구간으로 되돌린다.
   * (예전에는 +15만 올려 '관찰' 구간에 머물렀는데, 관리자가 정상이라고
   *  판정한 라인이 계속 주의색으로 남아 판단과 화면이 어긋났다)
   */
  async rejectShortage(id: string): Promise<ShortageEvent> {
    const event = this.shortageEvents.get(id);
    if (!event) throw new Error(`알 수 없는 부족 이벤트: ${id}`);

    const updated: ShortageEvent = { ...event, status: 'rejected' };
    this.shortageEvents.set(id, updated);
    this.emitShortage(updated);

    const line = this.lines.get(event.lineId);
    if (line) this.correctToNormal(line);

    return updated;
  }

  /**
   * 관리자가 카메라로 확인한 결과를 그대로 반영한다.
   *
   * 'sufficient'  → 진행 중인 건을 취소하고 로봇을 되돌린 뒤 측정값을 정상으로 보정
   * 'shortage'    → 측정값을 임계치까지 내리고 보충 작업을 즉시 착수
   *
   * 'shortage'가 승인 대기를 거치지 않는 이유는, 지시한 사람이 곧 승인권자이기 때문이다.
   * 자기가 누른 버튼에 대해 다시 승인 팝업을 띄우면 같은 판단을 두 번 묻는 꼴이 된다.
   */
  async overrideLineStock(lineId: string, verdict: StockVerdict, by: string): Promise<Line> {
    const line = this.lines.get(lineId);
    if (!line) throw new Error(`알 수 없는 라인: ${lineId}`);

    if (verdict === 'sufficient') {
      this.cancelOpenShortages(lineId);
      this.abortTask(lineId);
      this.correctToNormal(line);
      return { ...line };
    }

    // 이미 처리 중인 건이 있으면 로봇을 두 번 보내지 않는다.
    if (this.hasActiveShortage(lineId)) return { ...line };

    line.currentQty = Math.min(line.currentQty, line.threshold);
    line.updatedAt = nowIso();
    this.cooldownUntilTick.delete(lineId);
    this.emitInventory(line);

    const event: ShortageEvent = {
      id: makeId('shortage'),
      lineId,
      detectedAt: nowIso(),
      status: 'dispatched',
      partName: PART_NAMES[Math.floor(Math.random() * PART_NAMES.length)] ?? '부품',
      requiredQty: 20 + Math.floor(Math.random() * 30),
      approvedBy: by,
      approvedAt: nowIso(),
    };
    this.shortageEvents.set(event.id, event);
    this.emitShortage(event);
    this.startReplenishment(event);

    return { ...line };
  }

  /**
   * 학습 라벨 수집구.
   *
   * 실제 백엔드라면 재학습 데이터셋에 적재될 자리다. 여기서는 읽는 쪽이 없으므로
   * 쌓아 두지 않고 로그만 남긴다. 아무도 보지 않는 배열에 모으면
   * "저장되고 있다"는 잘못된 인상만 남는다.
   */
  async submitDetectionFeedback(input: DetectionFeedbackInput): Promise<void> {
    console.info('[detection-feedback] 학습 라벨 수집:', input);
  }

  private emitShortage(event: ShortageEvent): void {
    this.emitter.emit({ type: 'line.shortage', payload: event });
  }

  private emitInventory(line: Line): void {
    // 실제 백엔드라면 시계열 테이블에 적재될 지점.
    // 여기서 쌓아 두어야 새로고침 직후에도 그래프가 비어 있지 않다.
    const history = this.inventoryHistory.get(line.id) ?? [];
    this.inventoryHistory.set(
      line.id,
      [...history, { qty: line.currentQty, at: line.updatedAt }].slice(-MAX_HISTORY_POINTS),
    );

    this.emitter.emit({
      type: 'line.inventory',
      payload: { lineId: line.id, currentQty: line.currentQty, status: line.status, updatedAt: line.updatedAt },
    });
  }

  private emitRobot(robot: RobotStatus): void {
    this.emitter.emit({ type: 'robot.status', payload: { ...robot } });
  }

  private setLineStatus(lineId: string, status: Line['status']): void {
    const line = this.lines.get(lineId);
    if (!line) return;
    line.status = status;
    line.updatedAt = nowIso();
    this.emitInventory(line);
  }

  /** 관리자가 "부족 아님"으로 판정한 라인의 측정값을 정상 구간으로 바로잡는다. */
  private correctToNormal(line: Line): void {
    line.currentQty = Math.max(line.currentQty, line.threshold * CONFIRMED_NORMAL_MULTIPLIER);
    line.status = 'normal';
    line.updatedAt = nowIso();
    // 보정 직후 감소가 겹쳐 같은 알림이 다시 뜨면 판정이 무시된 것처럼 보인다.
    this.cooldownUntilTick.set(line.id, this.tick + CORRECTION_COOLDOWN_TICKS);
    this.emitInventory(line);
  }

  private startReplenishment(event: ShortageEvent): void {
    this.setLineStatus(event.lineId, 'restocking');
    this.activeTasks.set(event.lineId, {
      shortageEventId: event.id,
      lineId: event.lineId,
      step: 'dispatch_storage',
      progress: 0,
    });
  }

  /** 진행 중인 부족 건을 모두 반려로 닫는다. 완료·반려 건은 그대로 둔다. */
  private cancelOpenShortages(lineId: string): void {
    for (const event of this.shortageEvents.values()) {
      if (event.lineId !== lineId || !ACTIVE_SHORTAGE_STATUSES.has(event.status)) continue;
      const updated: ShortageEvent = { ...event, status: 'rejected' };
      this.shortageEvents.set(event.id, updated);
      this.emitShortage(updated);
    }
  }

  /**
   * 진행 중인 보충 작업을 중단하고 로봇을 대기 상태로 되돌린다.
   *
   * 보관소 OMX-F와 Beagle은 전 라인이 공유하므로, 다른 라인의 작업이 남아 있으면
   * 건드리지 않는다. 취소한 라인의 하역 로봇만 확실히 내려놓는다.
   */
  private abortTask(lineId: string): void {
    if (!this.activeTasks.delete(lineId)) return;

    const lineRobot = this.robots.get(`omxf-${lineId}`);
    if (lineRobot && lineRobot.state !== 'idle') {
      lineRobot.state = 'idle';
      lineRobot.updatedAt = nowIso();
      this.emitRobot(lineRobot);
    }

    if (this.activeTasks.size > 0) return;

    const storage = this.robots.get('omxf-storage-1');
    if (storage && storage.state !== 'idle') {
      storage.state = 'idle';
      storage.updatedAt = nowIso();
      this.emitRobot(storage);
    }

    const beagle = this.robots.get('beagle-1');
    if (beagle) {
      beagle.state = 'idle';
      beagle.position = { ...STORAGE_POSITION };
      beagle.updatedAt = nowIso();
      this.emitRobot(beagle);
    }
  }

  private hasActiveShortage(lineId: string): boolean {
    for (const event of this.shortageEvents.values()) {
      if (event.lineId === lineId && ACTIVE_SHORTAGE_STATUSES.has(event.status)) return true;
    }
    return false;
  }

  private step(): void {
    this.tick += 1;
    this.decayRandomLine();
    this.advanceTasks();
  }

  private decayRandomLine(): void {
    const lines = Array.from(this.lines.values());
    const line = lines[Math.floor(Math.random() * lines.length)];
    if (!line) return;
    if (line.status === 'restocking') return;

    const cooldown = this.cooldownUntilTick.get(line.id) ?? 0;
    if (cooldown > this.tick) return;

    line.currentQty = Math.max(0, line.currentQty - (2 + Math.random() * 5));
    line.updatedAt = nowIso();
    this.emitInventory(line);

    if (line.currentQty <= line.threshold && !this.hasActiveShortage(line.id)) {
      const event: ShortageEvent = {
        id: makeId('shortage'),
        lineId: line.id,
        detectedAt: nowIso(),
        status: 'pending_approval',
        partName: PART_NAMES[Math.floor(Math.random() * PART_NAMES.length)] ?? '부품',
        requiredQty: 20 + Math.floor(Math.random() * 30),
      };
      this.shortageEvents.set(event.id, event);
      this.emitShortage(event);
    }
  }

  private advanceTasks(): void {
    for (const task of Array.from(this.activeTasks.values())) {
      this.advanceTask(task);
    }
  }

  private advanceTask(task: ActiveTask): void {
    const line = this.lines.get(task.lineId);
    const storage = this.robots.get('omxf-storage-1');
    const beagle = this.robots.get('beagle-1');
    const lineRobot = this.robots.get(`omxf-${task.lineId}`);
    if (!line || !storage || !beagle || !lineRobot) {
      this.activeTasks.delete(task.lineId);
      return;
    }

    task.progress += 1 / STEP_TICKS;

    if (task.step === 'dispatch_storage') {
      storage.state = 'working';
      storage.updatedAt = nowIso();
      this.emitRobot(storage);

      if (task.progress >= 1) {
        task.step = 'beagle_to_line';
        task.progress = 0;
        storage.state = 'idle';
        storage.updatedAt = nowIso();
        this.emitRobot(storage);
        this.transitionShortage(task.shortageEventId, 'in_transit');
      }
    } else if (task.step === 'beagle_to_line') {
      beagle.state = 'moving';
      const t = Math.min(1, task.progress);
      beagle.position = {
        x: lerp(STORAGE_POSITION.x, line.position.x, t),
        y: lerp(STORAGE_POSITION.y, line.position.y, t),
      };
      beagle.updatedAt = nowIso();
      this.emitRobot(beagle);

      if (task.progress >= 1) {
        task.step = 'unload';
        task.progress = 0;
        beagle.state = 'idle';
        beagle.updatedAt = nowIso();
        this.emitRobot(beagle);
      }
    } else if (task.step === 'unload') {
      lineRobot.state = 'working';
      lineRobot.updatedAt = nowIso();
      this.emitRobot(lineRobot);

      if (task.progress >= 1) {
        task.step = 'done';
        lineRobot.state = 'idle';
        lineRobot.updatedAt = nowIso();
        this.emitRobot(lineRobot);

        line.currentQty = 95;
        line.status = 'normal';
        line.updatedAt = nowIso();
        this.emitInventory(line);
        this.transitionShortage(task.shortageEventId, 'completed');

        beagle.position = { ...STORAGE_POSITION };
        beagle.updatedAt = nowIso();
        this.emitRobot(beagle);
      }
    }

    if (task.step === 'done') {
      this.activeTasks.delete(task.lineId);
    } else {
      this.activeTasks.set(task.lineId, task);
    }
  }

  private transitionShortage(id: string, status: ShortageEvent['status']): void {
    const event = this.shortageEvents.get(id);
    if (!event) return;
    const updated: ShortageEvent = { ...event, status };
    this.shortageEvents.set(id, updated);
    this.emitShortage(updated);
  }
}

export const mockFactoryBackend = new MockFactoryBackend();
