import type { Snapshot } from '../domain/schemas';
import type { Camera, InventoryPoint, Permissions, ShortageEvent } from '../domain/types';

export type { Snapshot };

/**
 * 백엔드에 대한 유일한 계약.
 *
 * 화면 코드는 이 인터페이스만 알고, 구현이 mock인지 실제 FastAPI인지 모른다.
 * 백엔드가 완성되면 `.env`의 VITE_USE_MOCK만 false로 바꾸면 전환된다.
 *
 * 모든 메서드가 signal을 받는 이유는 React Query의 요청 취소를 그대로
 * 흘려보내기 위함이다. 탭을 빠르게 옮길 때 죽은 요청이 쌓이지 않는다.
 */
export interface FactoryApi {
  /** 부팅 시 1회. 라인·로봇·부족 이벤트 전체. */
  fetchSnapshot(signal?: AbortSignal): Promise<Snapshot>;

  /** 승인 → 보관소 OMX-F 적재 + Beagle 운반 지시 */
  approveShortage(input: { id: string; approvedBy: string }): Promise<ShortageEvent>;

  /** 반려 → 쿨다운 후 재감지 */
  rejectShortage(input: { id: string }): Promise<ShortageEvent>;

  /** 설치된 카메라 목록 */
  fetchCameras(signal?: AbortSignal): Promise<Camera[]>;

  /** 승인 권한 설정 조회/저장 */
  fetchPermissions(signal?: AbortSignal): Promise<Permissions>;
  updatePermissions(input: Permissions): Promise<Permissions>;

  /** 라인별 재고 추이 (그래프용) */
  fetchInventoryHistory(input: { lineId: string }, signal?: AbortSignal): Promise<InventoryPoint[]>;
}
