import type { Tone } from '../ui/tone';
import type { Line, RobotState, ShortageEventStatus, StockVerdict } from './types';

/**
 * 도메인 상태 → Tone 매핑을 이 파일 하나로 통제한다.
 * "부족은 무슨 색인가"를 화면마다 다시 판단하지 않게 하려는 목적이며,
 * 색 기준이 바뀌면 여기만 고치면 전 화면에 반영된다.
 */

/** 임계치 대비 여유분으로 심각도를 나눈다. (임계치 이하 = 부족) */
export function toneForLine(line: Line): Tone {
  if (line.status === 'restocking') return 'accent';
  if (line.currentQty <= line.threshold) return 'critical';
  if (line.currentQty <= line.threshold * 1.5) return 'serious';
  if (line.currentQty <= line.threshold * 2.5) return 'warning';
  return 'good';
}

/**
 * 시스템이 이 라인을 "부족으로 취급 중"인가.
 *
 * 관리자 토글이 어느 방향으로 갈지 정하는 기준이라, 색 계산과 따로 둔다.
 * 보충 중(restocking)도 포함해야 한다 — 색은 파랑이지만 "부족해서 로봇이 가는 중"이므로,
 * 관리자가 지금 누를 수 있는 버튼은 '정상으로 되돌리기'(=작업 취소)여야 한다.
 */
export function isTreatedAsShortage(line: Line): boolean {
  return line.status === 'restocking' || line.currentQty <= line.threshold;
}

/** 관리자가 토글했을 때 넘어갈 반대 판정. */
export function oppositeVerdict(line: Line): StockVerdict {
  return isTreatedAsShortage(line) ? 'sufficient' : 'shortage';
}

/** 비전이 지금 내리고 있는 판정. 관리자 판정과 짝지어 학습 라벨이 된다. */
export function detectedVerdict(line: Line): StockVerdict {
  return isTreatedAsShortage(line) ? 'shortage' : 'sufficient';
}

const ROBOT_STATE_TONE: Record<RobotState, Tone> = {
  idle: 'idle',
  moving: 'accent',
  working: 'accent',
  error: 'critical',
  offline: 'idle',
};

export function toneForRobotState(state: RobotState): Tone {
  return ROBOT_STATE_TONE[state];
}

const SHORTAGE_STATUS_TONE: Record<ShortageEventStatus, Tone> = {
  pending_approval: 'critical',
  dispatched: 'warning',
  in_transit: 'accent',
  completed: 'good',
  rejected: 'idle',
};

export function toneForShortageStatus(status: ShortageEventStatus): Tone {
  return SHORTAGE_STATUS_TONE[status];
}

export const ROBOT_STATE_LABEL: Record<RobotState, string> = {
  idle: '대기',
  moving: '이동 중',
  working: '작업 중',
  error: '오류',
  offline: '오프라인',
};

export const SHORTAGE_STATUS_LABEL: Record<ShortageEventStatus, string> = {
  pending_approval: '승인 대기',
  dispatched: '보충 지시됨',
  in_transit: '운반 중',
  completed: '완료',
  rejected: '반려됨',
};

/**
 * "아직 끝나지 않은 부족 건" — 평면도 LED와 사이드 패널이 같은 기준을 봐야 하는 집합.
 *
 * 두 화면이 각자 리터럴을 들고 있으면, 상태가 하나 늘었을 때 한쪽만 고쳐도
 * 타입 검사를 통과한다. 그러면 LED는 "조치 필요"로 깜박이는데 그 LED를 눌러
 * 연 패널은 같은 건을 '지난 이력'으로 분류하는 모순이 조용히 생긴다.
 */
export const OPEN_SHORTAGE_STATUSES = new Set<ShortageEventStatus>([
  'pending_approval',
  'dispatched',
  'in_transit',
]);

export function isOpenShortage(status: ShortageEventStatus): boolean {
  return OPEN_SHORTAGE_STATUSES.has(status);
}
