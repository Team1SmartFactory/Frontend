import type { Tone } from '../ui/tone';
import type { Line, RobotState, ShortageEventStatus, StockVerdict } from './types';

/**
 * 도메인 상태 → Tone 매핑을 이 파일 하나로 통제한다.
 * "부족은 무슨 색인가"를 화면마다 다시 판단하지 않게 하려는 목적이며,
 * 색 기준이 바뀌면 여기만 고치면 전 화면에 반영된다.
 */

/**
 * 아래 세 함수가 실제로 필요로 하는 최소 형태 — Line뿐 아니라 Bin도 status/
 * currentQty/threshold를 그대로 갖고 있어서 별도 변환 없이 쓸 수 있다
 * (line-a 칸 단위 화면이 이 함수들을 그대로 재사용한다).
 */
type StockLevel = Pick<Line, 'status' | 'currentQty' | 'threshold'>;

/** 임계치 대비 여유분으로 심각도를 나눈다. (임계치 이하 = 부족) */
export function toneForLine(line: StockLevel): Tone {
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
export function isTreatedAsShortage(line: StockLevel): boolean {
  return line.status === 'restocking' || line.currentQty <= line.threshold;
}

/** 관리자가 토글했을 때 넘어갈 반대 판정. */
export function oppositeVerdict(line: StockLevel): StockVerdict {
  return isTreatedAsShortage(line) ? 'sufficient' : 'shortage';
}

/** 비전이 지금 내리고 있는 판정. 관리자 판정과 짝지어 학습 라벨이 된다. */
export function detectedVerdict(line: Line): StockVerdict {
  return isTreatedAsShortage(line) ? 'shortage' : 'sufficient';
}

/**
 * toneForLine 결과를 사람이 읽는 라벨로. 색만으로 의미를 전달하면 안 되므로
 * (색맹 접근성) 뱃지는 항상 이 텍스트와 함께 보여준다 — line-a 칸 단위 화면도
 * 같은 라벨을 써야 '보충 중'과 '부족'이 갈라지지 않는다(라이브 확인 중 발견,
 * 칸 목록이 tone은 파랑인데 라벨은 '부족'으로 남아있던 버그).
 */
export const STOCK_TONE_LABEL: Record<Tone, string> = {
  critical: '부족',
  accent: '보충 중',
  serious: '주의',
  warning: '관찰',
  good: '정상',
  idle: '대기',
};

const ROBOT_STATE_TONE: Record<RobotState, Tone> = {
  idle: 'idle',
  moving: 'accent',
  working: 'accent',
  error: 'critical',
  offline: 'idle',
  /*
   * 멈춰 선 팔은 고장(critical)이 아니라 "사람이 눌러야 다시 도는" 상태다.
   * 빨강을 함께 쓰면 화면에서 진짜 오류와 구분되지 않으므로 한 단계 낮춘다.
   */
  blocked: 'serious',
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
  blocked: '작업 정지',
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

/**
 * 승인이 떨어져 로봇이 실제로 움직이고 있는 건 — OPEN_SHORTAGE_STATUSES의
 * 부분집합이다. 평면도는 이 상태를 '부족'(빨강)이 아니라 '보충 중'(파랑)으로
 * 갈라 보여야 한다(이슈 #38): 승인을 눌렀는데도 화면이 계속 빨갛게 경보를
 * 울리면, 관리자는 승인이 안 먹었다고 판단해 같은 건을 다시 조치하려 든다.
 */
export const REFILL_IN_PROGRESS_STATUSES = new Set<ShortageEventStatus>([
  'dispatched',
  'in_transit',
]);

export function isRefillInProgress(status: ShortageEventStatus): boolean {
  return REFILL_IN_PROGRESS_STATUSES.has(status);
}
