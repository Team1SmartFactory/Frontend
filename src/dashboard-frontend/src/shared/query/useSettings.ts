import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import { DEFAULT_PERMISSIONS, type Permissions } from '../domain/types';
import { queryKeys } from './queryKeys';

/**
 * 승인 권한 설정.
 *
 * 원래 localStorage에만 있어 관리자마다 값이 달랐다.
 * 로봇 자동 동작 여부를 결정하는 설정이므로 서버가 보관하는 것이 맞고,
 * 여기서는 그 전환을 미리 마쳐 둔 상태다. (mock이 localStorage를 대신 씀)
 */
export function usePermissions() {
  const { data, isPending, isError, error } = useQuery<Permissions, ApiError>({
    queryKey: queryKeys.settings.permissions(),
    queryFn: ({ signal }) => factoryApi.fetchPermissions(signal),
  });

  return { permissions: data ?? DEFAULT_PERMISSIONS, isPending, isError, error };
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();

  return useMutation<Permissions, ApiError, Permissions>({
    mutationFn: (input) => factoryApi.updatePermissions(input),
    // 서버가 정규화한 값을 그대로 캐시에 넣는다.
    // (승인자 목록 정리 등 서버 가공이 있을 수 있어 응답을 신뢰한다)
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.settings.permissions(), saved);
    },
  });
}
