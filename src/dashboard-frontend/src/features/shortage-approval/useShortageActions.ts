import { useCallback } from 'react';
import { CURRENT_OPERATOR } from '../../shared/domain/actor';
import type { FeedbackSource, ShortageEvent, StockVerdict } from '../../shared/domain/types';
import { useSubmitDetectionFeedback } from '../../shared/query/useDetectionFeedback';
import { useApproveShortage, useRejectShortage } from '../../shared/query/useShortageMutations';

/**
 * 승인/반려 액션을 화면이 쓰기 좋은 형태로 감싼다.
 *
 * 실제 요청과 캐시 갱신은 Query mutation이 담당하고, 여기서는 "누가 판단했는가"를
 * 채워 넣고 그 판단을 학습 라벨로 남기는 일을 한다. 실패해도 예외를 던지지 않아
 * 네트워크 오류가 팝업 자체를 멈추지 않는다. (사용자는 버튼을 다시 누를 수 있다)
 */
export function useShortageActions() {
  const approveMutation = useApproveShortage();
  const rejectMutation = useRejectShortage();
  const feedback = useSubmitDetectionFeedback();

  /**
   * 부족 알림은 언제나 비전이 'shortage'로 판정해 뜬 것이므로, detected는 늘 'shortage'다.
   * 관리자가 무엇으로 정정했는지(corrected)가 라벨의 내용이 된다.
   */
  const recordDecision = useCallback(
    (event: ShortageEvent, corrected: StockVerdict, source: FeedbackSource) => {
      feedback.mutate(
        {
          lineId: event.lineId,
          detected: 'shortage',
          corrected,
          source,
          by: CURRENT_OPERATOR,
          shortageEventId: event.id,
        },
        { onError: (error) => console.error('[detection-feedback] 라벨 전송 실패:', error) },
      );
    },
    [feedback],
  );

  const approve = useCallback(
    async (event: ShortageEvent) => {
      try {
        await approveMutation.mutateAsync({ id: event.id, approvedBy: CURRENT_OPERATOR });
      } catch (error) {
        console.error('[shortage] 승인 처리 실패:', error);
        return;
      }
      // 승인 = "부족이 맞다". 감지가 옳았음을 사람이 확인해 준 양성 라벨.
      recordDecision(event, 'shortage', 'approve');
    },
    [approveMutation, recordDecision],
  );

  const reject = useCallback(
    async (event: ShortageEvent) => {
      try {
        await rejectMutation.mutateAsync({ id: event.id });
      } catch (error) {
        console.error('[shortage] 반려 처리 실패:', error);
        return;
      }
      // 반려 = "부족이 아닌데 부족이라고 했다". 오탐 라벨.
      recordDecision(event, 'sufficient', 'reject');
    },
    [rejectMutation, recordDecision],
  );

  /**
   * 설정에서 승인 필수를 껐을 때의 자동 승인.
   *
   * 사람이 카메라를 확인하지 않은 승인이므로 학습 라벨을 만들지 않는다.
   * 검증되지 않은 라벨을 섞으면 모델이 자기 판정을 자기가 되먹임하게 된다.
   */
  const autoApprove = useCallback(
    async (event: ShortageEvent) => {
      try {
        await approveMutation.mutateAsync({ id: event.id, approvedBy: CURRENT_OPERATOR });
      } catch (error) {
        console.error('[shortage] 자동 승인 실패:', error);
      }
    },
    [approveMutation],
  );

  return {
    approve,
    reject,
    autoApprove,
    /**
     * 요청이 진행 중인 이벤트 id. 버튼 비활성화에 쓴다.
     * "무언가 진행 중"이 아니라 "어느 건이 진행 중"이어야 팝업이 큐로 넘어갈 때
     * 다음 건의 버튼까지 잠기지 않는다.
     */
    pendingId: approveMutation.variables?.id ?? rejectMutation.variables?.id ?? null,
  };
}
