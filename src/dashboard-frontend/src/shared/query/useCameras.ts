import { useQuery } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { Camera } from '../domain/types';
import { queryKeys } from './queryKeys';

const EMPTY: readonly Camera[] = Object.freeze([]);

/**
 * 설치된 카메라 목록.
 *
 * 이전에는 CctvTab이 라인 목록에서 `cam-${line.id}`를 만들어 썼다.
 * 라인당 카메라가 정확히 1대라는 가정이 코드에 박혀 있던 셈이라,
 * 카메라를 독립 리소스로 분리했다.
 */
export function useCameras() {
  const { data, isPending, isError, error } = useQuery<Camera[], ApiError>({
    queryKey: queryKeys.cameras.list(),
    queryFn: ({ signal }) => factoryApi.fetchCameras(signal),
  });

  return { cameras: data ?? (EMPTY as Camera[]), isPending, isError, error };
}
