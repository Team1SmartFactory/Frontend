import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query/queryKeys';
import type { FactoryData } from '../query/useFactoryData';
import type { InventoryPoint } from '../domain/types';
import type { RealtimeMessage } from '../domain/schemas';
import { realtimeClient } from './realtimeClientFactory';
import { useConnectionStore } from '../../store/useConnectionStore';

/** 그래프가 들고 있을 최대 점 개수. 오래된 점부터 버린다. */
const MAX_HISTORY_POINTS = 30;

/**
 * 실시간 메시지를 Query 캐시에 반영한다.
 *
 * 이 앱은 요청-응답이 아니라 푸시로 갱신되므로, Query의 기본 동작
 * (stale 판정 → 재조회)에 기대지 않는다. 대신 WebSocket이 도착할 때마다
 * setQueryData로 캐시를 직접 갱신한다.
 * invalidateQueries를 쓰지 않는 이유는, 초당 여러 건 들어오는 로봇 위치마다
 * 스냅샷 전체를 다시 받게 되어 실시간성이 오히려 나빠지기 때문이다.
 *
 * 갱신은 항상 변경된 항목만 새 객체로 만들고 나머지는 참조를 유지한다.
 * 그래야 useLines를 구독한 화면이 로봇 이동 때문에 리렌더되지 않는다.
 */
function applyMessage(queryClient: QueryClient, message: RealtimeMessage): void {
  switch (message.type) {
    case 'line.inventory': {
      const { lineId, currentQty, status, updatedAt } = message.payload;

      queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) => {
        const existing = prev?.lines[lineId];
        // 스냅샷에 없는 라인은 무시한다. 부분 데이터로 캐시를 만들면
        // 필수 필드(name, position 등)가 빠진 Line이 생긴다.
        if (!prev || !existing) return prev;

        return {
          ...prev,
          lines: { ...prev.lines, [lineId]: { ...existing, currentQty, status, updatedAt } },
        };
      });

      // 재고 추이 그래프는 별도 캐시 키를 쓴다.
      // 서버 이력(useInventoryHistory)이 채운 배열에 이어 붙인다.
      queryClient.setQueryData<InventoryPoint[]>(
        queryKeys.inventory.history(lineId),
        (prev) => [...(prev ?? []), { qty: currentQty, at: updatedAt }].slice(-MAX_HISTORY_POINTS),
      );
      return;
    }

    case 'line.shortage': {
      const event = message.payload;
      queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) =>
        prev ? { ...prev, shortageEvents: { ...prev.shortageEvents, [event.id]: event } } : prev,
      );
      return;
    }

    case 'robot.status': {
      const robot = message.payload;
      queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) =>
        prev ? { ...prev, robots: { ...prev.robots, [robot.robotId]: robot } } : prev,
      );
      return;
    }
  }
}

/**
 * 앱 루트에서 한 번만 호출한다.
 * 초기 스냅샷은 useFactoryData의 쿼리가 담당하고, 이 훅은 이후 변경분만 맡는다.
 */
export function useRealtimeSync(): void {
  const queryClient = useQueryClient();
  const setStatus = useConnectionStore((state) => state.setStatus);

  useEffect(() => {
    const unsubscribeMessages = realtimeClient.onMessage((message) => {
      applyMessage(queryClient, message);
    });
    const unsubscribeStatus = realtimeClient.onStatusChange(setStatus);

    realtimeClient.connect();

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      realtimeClient.disconnect();
    };
  }, [queryClient, setStatus]);
}
