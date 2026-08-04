import type { RealtimeMessage } from '../domain/schemas';

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

/**
 * 실시간 갱신 채널에 대한 추상 인터페이스.
 * WebSocketRealtimeClient(실제 백엔드)와 MockRealtimeClient(시뮬레이션)가
 * 동일한 계약을 구현한다.
 */
export interface RealtimeClient {
  connect(): void;
  disconnect(): void;
  /** 유효성 검증을 통과한 메시지만 전달된다. 구독 해제 함수를 반환한다. */
  onMessage(handler: (message: RealtimeMessage) => void): () => void;
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void;
}
