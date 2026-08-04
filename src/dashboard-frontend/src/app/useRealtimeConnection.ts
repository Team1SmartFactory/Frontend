import { useEffect } from 'react';
import { apiClient } from '../shared/api/apiClientFactory';
import { realtimeClient } from '../shared/realtime/realtimeClientFactory';
import { useFactoryStore } from '../store/useFactoryStore';

/**
 * 앱 루트에서 한 번만 호출한다.
 * 1) REST로 초기 스냅샷을 받아 스토어를 채우고(hydrate)
 * 2) 실시간 채널을 열어 이후 변경분만 반영한다.
 * 언마운트 시 구독/연결을 모두 정리해 메모리 누수를 막는다.
 */
export function useRealtimeConnection(): void {
  const hydrate = useFactoryStore((state) => state.hydrate);
  const applyRealtimeMessage = useFactoryStore((state) => state.applyRealtimeMessage);
  const setConnectionStatus = useFactoryStore((state) => state.setConnectionStatus);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .fetchSnapshot()
      .then((snapshot) => {
        if (!cancelled) hydrate(snapshot);
      })
      .catch((error: unknown) => {
        console.error('[bootstrap] 초기 스냅샷 로드 실패:', error);
      });

    const unsubscribeMessages = realtimeClient.onMessage(applyRealtimeMessage);
    const unsubscribeStatus = realtimeClient.onStatusChange(setConnectionStatus);
    realtimeClient.connect();

    return () => {
      cancelled = true;
      unsubscribeMessages();
      unsubscribeStatus();
      realtimeClient.disconnect();
    };
  }, [hydrate, applyRealtimeMessage, setConnectionStatus]);
}
