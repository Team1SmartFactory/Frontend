import { useCallback, useState } from 'react';
import { ApiError, extractNotReadyDetail, type NotReadyDetail } from '../../shared/api/ApiError';
import { CURRENT_OPERATOR } from '../../shared/domain/actor';
import type { ShortageEvent } from '../../shared/domain/types';
import { useDeleteShortage, useRestockShortage } from '../../shared/query/useShortageMutations';

/**
 * 반려 확인 항목(이슈 #46)의 두 액션 — 삭제와 물품 보충.
 *
 * 승인 팝업의 useShortageActions와 같은 태도: 실패해도 예외를 던지지 않고,
 * 준비 미비(409)의 사유만 해당 이벤트에 붙여 화면에 넘긴다. 사람이 창고에
 * 부품을 넣고 같은 항목에서 다시 누를 수 있어야 한다.
 */
interface NotReadyState {
  eventId: string;
  detail: NotReadyDetail;
}

export function useRejectedShortageActions() {
  const restockMutation = useRestockShortage();
  const deleteMutation = useDeleteShortage();
  const [notReady, setNotReady] = useState<NotReadyState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const restock = useCallback(
    async (event: ShortageEvent) => {
      setNotReady(null);
      setBusyId(event.id);
      try {
        await restockMutation.mutateAsync({ id: event.id, approvedBy: CURRENT_OPERATOR });
      } catch (error) {
        console.error('[shortage] 반려 건 재보충 실패:', error);
        const detail = error instanceof ApiError ? extractNotReadyDetail(error.detail) : null;
        if (detail) setNotReady({ eventId: event.id, detail });
      } finally {
        setBusyId(null);
      }
    },
    [restockMutation],
  );

  const remove = useCallback(
    async (event: ShortageEvent) => {
      setBusyId(event.id);
      try {
        await deleteMutation.mutateAsync({ id: event.id });
      } catch (error) {
        console.error('[shortage] 반려 건 삭제 실패:', error);
      } finally {
        setBusyId(null);
      }
    },
    [deleteMutation],
  );

  return {
    restock,
    remove,
    busyId,
    notReadyFor: (eventId: string): NotReadyDetail | null =>
      notReady?.eventId === eventId ? notReady.detail : null,
  };
}
