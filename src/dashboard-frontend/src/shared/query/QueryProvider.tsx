import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';

/**
 * QueryClient를 useState 초기화 함수로 만든다.
 * 모듈 최상위에서 만들면 테스트마다 캐시가 공유되어 이전 테스트의 데이터가 새어 나온다.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
