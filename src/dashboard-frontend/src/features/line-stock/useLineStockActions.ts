import { useCallback } from 'react';
import { CURRENT_OPERATOR } from '../../shared/domain/actor';
import { detectedVerdict } from '../../shared/domain/statusTone';
import type { Line, StockVerdict } from '../../shared/domain/types';
import { useSubmitDetectionFeedback } from '../../shared/query/useDetectionFeedback';
import { useOverrideLineStock } from '../../shared/query/useLineMutations';

/**
 * 관리자가 카메라로 확인한 현황을 반영하는 액션.
 *
 * 두 가지 일을 순서대로 한다.
 *   1. 라인 현황 변경 — 실패하면 여기서 멈춘다. 로봇이 움직이지 않았으므로 라벨도 남기면 안 된다.
 *   2. 학습 라벨 전송 — 실패해도 1번을 되돌리지 않는다. 이미 현장 조치는 나간 뒤다.
 */
export function useLineStockActions() {
  const override = useOverrideLineStock();
  const feedback = useSubmitDetectionFeedback();

  const setVerdict = useCallback(
    async (line: Line, verdict: StockVerdict): Promise<boolean> => {
      // 비전 판정은 반영 전에 읽어 둔다. 성공하면 line의 측정값이 곧 보정된다.
      const detected = detectedVerdict(line);

      try {
        await override.mutateAsync({ lineId: line.id, verdict, by: CURRENT_OPERATOR });
      } catch (error) {
        console.error('[line-stock] 현황 변경 실패:', error);
        return false;
      }

      feedback.mutate(
        {
          lineId: line.id,
          detected,
          corrected: verdict,
          source: 'manual_toggle',
          by: CURRENT_OPERATOR,
        },
        { onError: (error) => console.error('[detection-feedback] 라벨 전송 실패:', error) },
      );

      return true;
    },
    [override, feedback],
  );

  return { setVerdict, isPending: override.isPending, error: override.error };
}
