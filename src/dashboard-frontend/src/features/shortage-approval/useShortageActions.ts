import { useCallback, useState } from 'react';
import { apiClient } from '../../shared/api/apiClientFactory';
import { useFactoryStore } from '../../store/useFactoryStore';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * 승인/반려 액션을 캡슐화한다. 실패 시 예외를 삼키고 콘솔에만 기록해,
 * 네트워크 오류가 승인 팝업 자체를 멈추게 하지 않는다 (사용자는 버튼을 다시 누를 수 있다).
 */
export function useShortageActions() {
  const upsertShortageEvent = useFactoryStore((state) => state.upsertShortageEvent);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const approve = useCallback(
    async (id: string) => {
      setPendingId(id);
      try {
        const updated = await apiClient.approveShortage(id, currentUser?.displayName ?? '관리자');
        upsertShortageEvent(updated);
      } catch (error) {
        console.error('[shortage] 승인 처리 실패:', error);
      } finally {
        setPendingId(null);
      }
    },
    [currentUser, upsertShortageEvent],
  );

  const reject = useCallback(
    async (id: string) => {
      setPendingId(id);
      try {
        const updated = await apiClient.rejectShortage(id);
        upsertShortageEvent(updated);
      } catch (error) {
        console.error('[shortage] 반려 처리 실패:', error);
      } finally {
        setPendingId(null);
      }
    },
    [upsertShortageEvent],
  );

  return { approve, reject, pendingId };
}
