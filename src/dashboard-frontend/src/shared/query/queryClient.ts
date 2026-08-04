import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/ApiError';

const MAX_RETRIES = 2;

/**
 * 이 앱은 폴링이 아니라 WebSocket 푸시로 갱신된다.
 * 따라서 Query의 기본값(주기적 재조회, 포커스 시 재조회)은 대부분 꺼야 한다.
 * 캐시는 "서버 상태의 사본"이고, 최신화 책임은 실시간 채널이 진다.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 실시간 채널이 갱신을 담당하므로 stale 판정으로 재조회하지 않는다.
        staleTime: Infinity,
        // 탭 전환마다 스냅샷을 다시 받으면 WS가 채워둔 최신 상태를 덮어쓴다.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,

        /**
         * 4xx와 계약 불일치는 재시도해도 결과가 같다.
         * 네트워크/5xx만 지수 백오프로 재시도한다.
         */
        retry: (failureCount, error) => {
          if (error instanceof ApiError && !error.retryable) return false;
          return failureCount < MAX_RETRIES;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },

      mutations: {
        // 승인/반려는 부작용(로봇 동작)이 있다. 자동 재시도하면 중복 지시가 나갈 수 있어 끈다.
        retry: false,
      },
    },
  });
}
