import type { Line, ShortageEvent } from '../shared/domain/types';
import { isOpenShortage, toneForLine } from '../shared/domain/statusTone';
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
