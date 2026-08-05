import { useMutation, useQueryClient } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { ShortageEvent } from '../domain/types';
import { queryKeys } from './queryKeys';
import type { FactoryData } from './useFactoryData';

/**
 * 승인/반려 결과를 캐시에 즉시 반영한다.
 *
 * 서버도 같은 내용을 WebSocket으로 브로드캐스트하지만, 그것을 기다리면
 * 버튼을 누르고 나서 화면이 바뀌기까지 왕복 시간만큼 비어 보인다.
 * 응답으로 먼저 캐시를 갱신하고, 뒤이어 도착하는 실시간 메시지가
 * 같은 값을 덮어쓰게 둔다. (동일 id를 교체하므로 중복되지 않는다)
 */
function useWriteShortageEvent() {
  const queryClient = useQueryClient();

  return (event: ShortageEvent) => {
    queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) =>
      prev
        ? { ...prev, shortageEvents: { ...prev.shortageEvents, [event.id]: event } }
        : prev,
    );
  };
}

export function useApproveShortage() {
  const writeEvent = useWriteShortageEvent();

  return useMutation<ShortageEvent, ApiError, { id: string; approvedBy: string }>({
    mutationFn: (input) => factoryApi.approveShortage(input),
    onSuccess: writeEvent,
  });
}

export function useRejectShortage() {
  const writeEvent = useWriteShortageEvent();

  return useMutation<ShortageEvent, ApiError, { id: string }>({
    mutationFn: (input) => factoryApi.rejectShortage(input),
    onSuccess: writeEvent,
  });
}
