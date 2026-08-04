import type { ShortageEvent } from '../domain/types';
import type { Snapshot } from '../domain/schemas';

export type { Snapshot };

/**
 * REST 계층에 대한 추상 인터페이스.
 * httpApiClient(실제 백엔드)와 mockApiClient(브라우저 내 시뮬레이션)가
 * 동일한 계약을 구현하므로 화면 코드는 둘의 차이를 알 필요가 없다.
 */
export interface ApiClient {
  fetchSnapshot(): Promise<Snapshot>;
  approveShortage(id: string, approvedBy: string): Promise<ShortageEvent>;
  rejectShortage(id: string): Promise<ShortageEvent>;
}
