import type { Line, RobotStatus, ShortageEvent } from '../shared/domain/types';
import { isOpenShortage, isRefillInProgress, toneForLine } from '../shared/domain/statusTone';
import type { Tone } from '../shared/ui/tone';

/**
 * 조치 시급도 순서.
 * 부족(critical)이 최우선이고, 보충 지시가 나간 라인(accent)이 그다음이다.
 * "이미 손을 쓴 라인"보다 "아직 손을 못 쓴 라인"이 위로 오게 하려는 의도다.
 */
const TONE_PRIORITY: Record<Tone, number> = {
  critical: 0,
  accent: 1,
  serious: 2,
  warning: 3,
  good: 4,
  idle: 5,
};

/** 부족 라인이 항상 최상단에 오도록 정렬한다. (기본 대시보드 탭 요구사항) */
export function sortLinesByPriority(lines: Line[]): Line[] {
  return [...lines].sort((a, b) => {
    const diff = TONE_PRIORITY[toneForLine(a)] - TONE_PRIORITY[toneForLine(b)];
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

/** 관리자 승인 대기 중인 이벤트를 오래된 순으로 반환한다. (승인 팝업 큐) */
export function selectPendingApprovals(events: Record<string, ShortageEvent>): ShortageEvent[] {
  return Object.values(events)
    .filter((event) => event.status === 'pending_approval')
    .sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
}

/**
 * 작업 실패 후 스스로 멈춰(blocked) 사람의 복구를 기다리는 로봇들.
 *
 * 승인 큐(selectPendingApprovals)와 같은 규칙으로 오래된 것부터 돌려준다 —
 * 팝업이 한 번에 한 대씩만 보여주므로, 가장 오래 멈춰 있던 팔이 먼저 나와야
 * 한 대가 계속 뒤로 밀리지 않는다. updatedAt이 같은 경우(로봇 여러 대가 같은
 * 실패로 함께 멈추는 경우)에는 id로 갈라 순서가 렌더마다 흔들리지 않게 한다.
 */
export function selectBlockedRobots(robots: Record<string, RobotStatus>): RobotStatus[] {
  return Object.values(robots)
    .filter((robot) => robot.state === 'blocked')
    .sort(
      (a, b) =>
        a.updatedAt.localeCompare(b.updatedAt) || a.robotId.localeCompare(b.robotId),
    );
}

/** 평면도 탭에서 빨간 점 애니메이션을 표시할 라인 id 집합. */
export function selectActiveShortageLineIds(events: Record<string, ShortageEvent>): Set<string> {
  const ids = new Set<string>();
  Object.values(events).forEach((event) => {
    if (isOpenShortage(event.status)) ids.add(event.lineId);
  });
  return ids;
}

/**
 * 위와 같은 집합의 칸(bin) 단위 판. 평면도에서 어느 칸 글리프를 경보색으로
 * 물들일지 정한다.
 *
 * binId가 있는 이벤트만 들어가므로(line-a) 칸이 없는 라인은 자연히 빠진다.
 * Bin.id는 라인 접두어를 포함해 전역에서 유일하므로 lineId를 함께 키에 넣지 않는다.
 */
export function selectActiveShortageBinIds(events: Record<string, ShortageEvent>): Set<string> {
  const ids = new Set<string>();
  Object.values(events).forEach((event) => {
    if (event.binId && isOpenShortage(event.status)) ids.add(event.binId);
  });
  return ids;
}

/**
 * 아래 넷은 위 "열린 부족 건" 집합을 시급도로 가른 것이다 (이슈 #38).
 *
 * pending(승인 대기)은 아직 사람이 손을 못 쓴 건이라 경보색(빨강)을 유지해야
 * 하고, restocking(dispatched/in_transit)은 승인이 떨어져 로봇이 움직이는 중이라
 * '보충 중'(파랑)으로 보여야 한다 — 승인을 눌렀는데 화면이 계속 빨가면 관리자는
 * 승인이 안 먹었다고 판단한다. 한 칸에 두 상태가 겹칠 일은 없지만(칸당 활성
 * 이벤트 1개), 칸이 여럿인 라인은 겹칠 수 있으므로 라인 LED는 pending을 우선한다.
 */
export function selectPendingShortageLineIds(events: Record<string, ShortageEvent>): Set<string> {
  const ids = new Set<string>();
  Object.values(events).forEach((event) => {
    if (event.status === 'pending_approval') ids.add(event.lineId);
  });
  return ids;
}

export function selectRestockingLineIds(events: Record<string, ShortageEvent>): Set<string> {
  const ids = new Set<string>();
  Object.values(events).forEach((event) => {
    if (isRefillInProgress(event.status)) ids.add(event.lineId);
  });
  return ids;
}

export function selectPendingShortageBinIds(events: Record<string, ShortageEvent>): Set<string> {
  const ids = new Set<string>();
  Object.values(events).forEach((event) => {
    if (event.binId && event.status === 'pending_approval') ids.add(event.binId);
  });
  return ids;
}

export function selectRestockingBinIds(events: Record<string, ShortageEvent>): Set<string> {
  const ids = new Set<string>();
  Object.values(events).forEach((event) => {
    if (event.binId && isRefillInProgress(event.status)) ids.add(event.binId);
  });
  return ids;
}
