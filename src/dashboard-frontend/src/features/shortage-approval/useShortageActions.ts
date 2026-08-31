import { useCallback, useState } from 'react';
import { ApiError, extractNotReadyDetail, type NotReadyDetail } from '../../shared/api/ApiError';
import { CURRENT_OPERATOR } from '../../shared/domain/actor';
import type { FeedbackSource, ShortageEvent, StockVerdict } from '../../shared/domain/types';
import { useSubmitDetectionFeedback } from '../../shared/query/useDetectionFeedback';
import { useApproveShortage, useRejectShortage } from '../../shared/query/useShortageMutations';

/**
 * 창고가 준비되지 않아 승인이 거부된 건. 어느 이벤트의 거부인지 함께 들고 있어야
 * 큐가 다음 건으로 넘어갔을 때 이전 건의 사유가 남아 오해를 주지 않는다.
 */
interface NotReadyState {
  eventId: string;
  detail: NotReadyDetail;
}

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
  const [notReady, setNotReady] = useState<NotReadyState | null>(null);

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
      setNotReady(null);
      try {
        await approveMutation.mutateAsync({ id: event.id, approvedBy: CURRENT_OPERATOR });
      } catch (error) {
        console.error('[shortage] 승인 처리 실패:', error);
        /*
         * 창고가 아직 부품을 낼 수 없다는 거부(409)는 "실패"지만 버려야 할 건이
         * 아니다. 사람이 창고에 부품을 채우거나 AMR을 제자리로 보낸 뒤 같은 건을
         * 다시 승인해야 하므로, 이벤트는 승인 대기로 그대로 두고(캐시를 건드리지
         * 않으므로 큐에서 사라지지 않는다) 사유만 화면에 넘긴다.
         */
        const detail = error instanceof ApiError ? extractNotReadyDetail(error.detail) : null;
        if (detail) setNotReady({ eventId: event.id, detail });
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
     *
     * isPending까지 함께 봐야 한다 — mutation.variables는 요청이 끝나도 남기
     * 때문에, 실패해서 같은 건이 팝업에 그대로 있는 경우 버튼이 영영 잠긴 채로
     * 남는다. 다시 승인할 수 있어야 하는 창고 미준비(409)에서 치명적이다.
     */
    pendingId:
      (approveMutation.isPending ? approveMutation.variables?.id : undefined) ??
      (rejectMutation.isPending ? rejectMutation.variables?.id : undefined) ??
      null,
    /**
     * 창고가 준비되지 않아 거부된 건의 사유. 팝업이 지금 보여주는 이벤트의
     * 것일 때만 값이 있다.
     */
    notReadyFor: (eventId: string): NotReadyDetail | null =>
      notReady?.eventId === eventId ? notReady.detail : null,
  };
}
