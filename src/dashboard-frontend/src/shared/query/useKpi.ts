import { useQuery } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { Kpi } from '../domain/schemas';
import { queryKeys } from './queryKeys';

/**
 * 운영 지표 (이슈 #48).
 *
 * 스냅샷과 달리 WebSocket으로 밀려오지 않는 집계값이라, 이 쿼리만 예외적으로
 * 폴링한다. 보충 한 건이 분 단위라 15초면 충분히 실시간처럼 보이고,
 * 집계 자체가 이벤트 수십 건 스캔이라 서버에도 부담이 없다.
 */
export function useKpi() {
  const { data, isPending, isError } = useQuery<Kpi, ApiError>({
    queryKey: queryKeys.kpi.summary(),
    queryFn: ({ signal }) => factoryApi.fetchKpi(signal),
    refetchInterval: 15_000,
  });

  return { kpi: data, isPending, isError };
}
