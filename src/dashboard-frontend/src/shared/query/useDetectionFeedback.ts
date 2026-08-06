import { useMutation } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { DetectionFeedbackInput } from '../domain/types';

/**
 * 비전 판정과 관리자 판정의 대조 기록을 보낸다.
 *
 * 캐시를 건드리지 않는다. 화면에 보여 줄 값이 아니라 백엔드가 모아 두는
 * 학습 라벨이기 때문이다. 실패해도 되돌릴 것이 없으므로 재시도도 걸지 않는다.
 */
export function useSubmitDetectionFeedback() {
  return useMutation<void, ApiError, DetectionFeedbackInput>({
    mutationFn: (input) => factoryApi.submitDetectionFeedback(input),
  });
}
