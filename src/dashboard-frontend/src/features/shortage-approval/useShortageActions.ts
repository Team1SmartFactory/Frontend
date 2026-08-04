import { useCallback } from 'react';
import { useApproveShortage, useRejectShortage } from '../../shared/query/useShortageMutations';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * 승인/반려 액션을 화면이 쓰기 좋은 형태로 감싼다.
 *
 * 실제 요청과 캐시 갱신은 Query mutation이 담당하고, 여기서는
 * "누가 승인했는가"를 채워 넣는 일만 한다. 실패해도 예외를 던지지 않아
 * 네트워크 오류가 팝업 자체를 멈추지 않는다. (사용자는 버튼을 다시 누를 수 있다)
 */
export function useShortageActions() {
  const approveMutation = useApproveShortage();
  const rejectMutation = useRejectShortage();
  const currentUser = useAuthStore((state) => state.currentUser);

  const approvedBy = currentUser?.displayName ?? '관리자';

  const approve = useCallback(
    async (id: string) => {
      try {
        await approveMutation.mutateAsync({ id, approvedBy });
      } catch (error) {
        console.error('[shortage] 승인 처리 실패:', error);
      }
    },
    [approveMutation, approvedBy],
  );

  const reject = useCallback(
    async (id: string) => {
      try {
        await rejectMutation.mutateAsync({ id });
      } catch (error) {
        console.error('[shortage] 반려 처리 실패:', error);
      }
    },
    [rejectMutation],
  );

  return {
    approve,
    reject,
    /** 요청이 진행 중인 이벤트 id. 버튼 비활성화에 쓴다. */
    pendingId: approveMutation.variables?.id ?? rejectMutation.variables?.id ?? null,
    isBusy: approveMutation.isPending || rejectMutation.isPending,
    error: approveMutation.error ?? rejectMutation.error,
  };
}
