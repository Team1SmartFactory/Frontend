import { useMutation, useQueryClient } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { Bin, Line, StockVerdict } from '../domain/types';
import { queryKeys } from './queryKeys';
import type { FactoryData } from './useFactoryData';

/**
 * 관리자가 지정한 부품 현황을 서버에 반영하고, 응답으로 캐시를 먼저 갱신한다.
 *
 * 서버도 같은 변경을 WebSocket으로 흘려보내지만, 그것만 기다리면 버튼을 누른 뒤
 * 왕복 시간만큼 화면이 옛 상태로 남는다. (useShortageMutations와 같은 이유)
 */
export function useOverrideLineStock() {
  const queryClient = useQueryClient();

  return useMutation<Line, ApiError, { lineId: string; verdict: StockVerdict; by: string }>({
    mutationFn: (input) => factoryApi.overrideLineStock(input),
    onSuccess: (line) => {
      queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) =>
        prev ? { ...prev, lines: { ...prev.lines, [line.id]: line } } : prev,
      );
    },
  });
}

/** useOverrideLineStock의 칸(bin) 단위 버전 — 라인 전체가 아니라 그 라인의
 * bins 배열 안 해당 칸 하나만 캐시에서 갱신한다. */
export function useOverrideBinStock() {
  const queryClient = useQueryClient();

  return useMutation<Bin, ApiError, { lineId: string; binId: string; verdict: StockVerdict; by: string }>({
    mutationFn: (input) => factoryApi.overrideBinStock(input),
    onSuccess: (bin) => {
      queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) => {
        const line = prev?.lines[bin.lineId];
        if (!prev || !line) return prev;
        const bins = line.bins.map((b) => (b.id === bin.id ? bin : b));
        return { ...prev, lines: { ...prev.lines, [line.id]: { ...line, bins } } };
      });
    },
  });
}
