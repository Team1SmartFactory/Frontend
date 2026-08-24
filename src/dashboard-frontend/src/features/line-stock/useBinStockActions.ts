import { useCallback } from 'react';
import { CURRENT_OPERATOR } from '../../shared/domain/actor';
import type { Bin, StockVerdict } from '../../shared/domain/types';
import { useOverrideBinStock } from '../../shared/query/useLineMutations';

/**
 * 관리자가 카메라로 확인한 현황을 칸(bin) 단위로 반영하는 액션.
 *
 * useLineStockActions의 축소판이다 — 칸 단위는 아직 비전 연동이 없어(카메라
 * 캘리브레이션 전) 학습 라벨(detection-feedback) 전송은 생략한다.
 */
export function useBinStockActions() {
  const override = useOverrideBinStock();

  const setVerdict = useCallback(
    async (bin: Bin, verdict: StockVerdict): Promise<boolean> => {
      try {
        await override.mutateAsync({ lineId: bin.lineId, binId: bin.id, verdict, by: CURRENT_OPERATOR });
        return true;
      } catch (error) {
        console.error('[bin-stock] 현황 변경 실패:', error);
        return false;
      }
    },
    [override],
  );

  return { setVerdict, isPending: override.isPending, error: override.error };
}
