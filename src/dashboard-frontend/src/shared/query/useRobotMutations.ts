import { useMutation, useQueryClient } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { RobotStatus } from '../domain/types';
import { queryKeys } from './queryKeys';
import type { FactoryData } from './useFactoryData';

/**
 * 멈춰 선 팔의 복구 요청.
 *
 * 응답으로 캐시를 먼저 갱신하는 것은 승인/반려(useShortageMutations)와 같은
 * 이유다 — 뒤이어 오는 WebSocket이 같은 로봇을 덮어쓰므로 값이 갈라지지 않는다.
 * 다만 이 응답은 "복구 명령을 받았다"까지만 말해 준다. 팔이 실제로 다시 일을
 * 받는 상태가 됐는지는 로봇이 보내는 robot.status가 정하며, 팝업도 그쪽을 보고
 * 닫힌다. (백엔드가 아직 blocked를 그대로 돌려줘도 화면이 거짓말하지 않는다)
 */
export function useResumeRobot() {
  const queryClient = useQueryClient();

  return useMutation<RobotStatus, ApiError, { robotId: string }>({
    mutationFn: (input) => factoryApi.resumeRobot(input),
    onSuccess: (robot) => {
      queryClient.setQueryData<FactoryData>(queryKeys.factory.snapshot(), (prev) =>
        prev ? { ...prev, robots: { ...prev.robots, [robot.robotId]: robot } } : prev,
      );
    },
  });
}
