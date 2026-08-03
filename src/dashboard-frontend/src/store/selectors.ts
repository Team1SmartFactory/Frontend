import type { Line, ShortageEvent } from '../shared/domain/types';

const ACTIVE_SHORTAGE_STATUSES = new Set<ShortageEvent['status']>([
  'pending_approval',
  'dispatched',
  'in_transit',
]);

/** 부족(보충 중) 라인이 항상 최상단에 오도록 정렬한다. (기본 대시보드 탭 요구사항) */
export function sortLinesByPriority(lines: Line[]): Line[] {
  return [...lines].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    return a.status === 'restocking' ? -1 : 1;
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
    if (ACTIVE_SHORTAGE_STATUSES.has(event.status)) ids.add(event.lineId);
  });
  return ids;
}
