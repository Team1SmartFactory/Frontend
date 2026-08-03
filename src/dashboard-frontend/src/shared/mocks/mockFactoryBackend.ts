import { Emitter } from '../utils/emitter';
import type { RealtimeMessage } from '../domain/schemas';
import type { Line, Position, RobotStatus, ShortageEvent } from '../domain/types';
import type { Snapshot } from '../domain/schemas';

/**
 * 실제 백엔드(FastAPI + MQTT Broker + PostgreSQL)가 없는 상태에서도
 * 대시보드 MVP를 그대로 시연할 수 있도록, 설계 문서의 5단계 프레임워크를
 * 브라우저 메모리 안에서 흉내내는 시뮬레이터.
 *
 * ApiClient/RealtimeClient 계약을 그대로 따르므로, 실제 백엔드가 준비되면
 * mockApiClient/mockRealtimeClient를 httpApiClient/webSocketRealtimeClient로
 * 바꾸는 것만으로 이 파일 전체를 걷어낼 수 있다.
 */

const TICK_MS = 1200;
const SHORTAGE_THRESHOLD = 20;
const STEP_TICKS = 3;
const REJECT_COOLDOWN_TICKS = 3;

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

const INITIAL_QTY: Record<string, number> = {
  'line-a': 82,
  'line-b': 75,
  'line-c': 68,
  'line-d': 90,
  'line-e': 61,
  'line-f': 78,
};

const INITIAL_LINES: Line[] = Object.entries(LINE_POSITIONS).map(([id, position]) => ({
  id,
  name: `${id.slice(-1).toUpperCase()}라인`,
  threshold: SHORTAGE_THRESHOLD,
  currentQty: INITIAL_QTY[id] ?? 80,
  status: 'normal',
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
];

const PART_NAMES = ['M6 볼트 세트', '베어링 유닛', '알루미늄 브래킷', '센서 하우징'];

const ACTIVE_SHORTAGE_STATUSES = new Set<ShortageEvent['status']>([
  'pending_approval',
  'dispatched',
  'in_transit',
]);

class MockFactoryBackend {
  private lines = new Map<string, Line>(INITIAL_LINES.map((line) => [line.id, { ...line }]));
  private robots = new Map<string, RobotStatus>(INITIAL_ROBOTS.map((robot) => [robot.robotId, { ...robot }]));
  private shortageEvents = new Map<string, ShortageEvent>();
  private activeTasks = new Map<string, ActiveTask>();
  private cooldownUntilTick = new Map<string, number>();
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

  async approveShortage(id: string, approvedBy: string): Promise<ShortageEvent> {
    const event = this.shortageEvents.get(id);
    if (!event) throw new Error(`알 수 없는 부족 이벤트: ${id}`);

    const updated: ShortageEvent = { ...event, status: 'dispatched', approvedBy, approvedAt: nowIso() };
    this.shortageEvents.set(id, updated);
    this.emitShortage(updated);
    this.setLineStatus(event.lineId, 'restocking');
    this.activeTasks.set(event.lineId, {
      shortageEventId: id,
      lineId: event.lineId,
      step: 'dispatch_storage',
      progress: 0,
    });

    return updated;
  }

  async rejectShortage(id: string): Promise<ShortageEvent> {
    const event = this.shortageEvents.get(id);
    if (!event) throw new Error(`알 수 없는 부족 이벤트: ${id}`);

    const updated: ShortageEvent = { ...event, status: 'rejected' };
    this.shortageEvents.set(id, updated);
    this.emitShortage(updated);

    const line = this.lines.get(event.lineId);
    if (line) this.bumpLineQty(line, 15);
    this.cooldownUntilTick.set(event.lineId, this.tick + REJECT_COOLDOWN_TICKS);

    return updated;
  }

  private emitShortage(event: ShortageEvent): void {
    this.emitter.emit({ type: 'line.shortage', payload: event });
  }

  private emitInventory(line: Line): void {
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

  private bumpLineQty(line: Line, amount: number): void {
    line.currentQty = Math.min(100, line.currentQty + amount);
    line.updatedAt = nowIso();
    this.emitInventory(line);
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
