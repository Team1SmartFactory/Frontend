import type { ReactNode } from 'react';
import { useRealtimeSync } from '../shared/realtime/useRealtimeSync';

/**
 * 실시간 채널을 앱 수명 동안 한 번만 열어 둔다.
 *
 * QueryProvider 안쪽이어야 하는 이유는 useRealtimeSync가 queryClient에
 * 접근해 캐시를 직접 갱신하기 때문이다. 별도 컴포넌트로 뺀 것도 같은 이유로,
 * App에서 바로 호출하면 Provider보다 먼저 실행된다.
 */
export function RealtimeGate({ children }: { children: ReactNode }) {
  useRealtimeSync();
  return <>{children}</>;
}
