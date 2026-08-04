import { useQuery } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { InventoryPoint } from '../domain/types';
import { queryKeys } from './queryKeys';

const EMPTY: readonly InventoryPoint[] = Object.freeze([]);

/**
 * 라인별 재고 추이.
 *
 * 서버 이력을 먼저 받아 그래프를 채우고, 이후 변동은 실시간 메시지가
 * 같은 캐시 키에 이어 붙인다. (useRealtimeSync 참고)
 * 이렇게 해야 새로고침 직후에도 그래프가 비어 있지 않다.
 */
export function useInventoryHistory(lineId: string | null) {
  const { data, isPending, isError, error } = useQuery<InventoryPoint[], ApiError>({
    queryKey: queryKeys.inventory.history(lineId ?? ''),
    queryFn: ({ signal }) => factoryApi.fetchInventoryHistory({ lineId: lineId as string }, signal),
    enabled: Boolean(lineId),
  });

  return { history: data ?? (EMPTY as InventoryPoint[]), isPending, isError, error };
}
