/**
 * 백엔드 경로 모음.
 *
 * ★ 백엔드(FastAPI) 라우터가 확정되면 이 파일만 고치면 된다.
 *   쿼리 훅과 컴포넌트는 경로 문자열을 직접 알지 못한다.
 *
 * 함수로 감싼 것은 경로 파라미터를 타입 안전하게 만들기 위함이다.
 * (`/lines/${id}` 를 각 호출부에서 조립하면 오타를 컴파일러가 못 잡는다)
 */
export const ENDPOINTS = {
  /** 부팅 시 1회. 라인·로봇·부족 이벤트를 한 번에 받는다. */
  snapshot: () => '/snapshot',

  /** 부족 이벤트 승인/반려 */
  approveShortage: (id: string) => `/shortage-events/${encodeURIComponent(id)}/approve`,
  rejectShortage: (id: string) => `/shortage-events/${encodeURIComponent(id)}/reject`,

  /** 설치된 카메라 목록. 지금은 라인당 1대지만 실제로는 1:N일 수 있다. */
  cameras: () => '/cameras',

  /** 승인 권한 설정. 로봇 자동 동작 여부를 결정하므로 서버가 보관해야 한다. */
  permissions: () => '/settings/permissions',

  /** 라인별 재고 추이. 새로고침해도 그래프가 남아 있으려면 서버 이력이 필요하다. */
  inventoryHistory: (lineId: string) =>
    `/lines/${encodeURIComponent(lineId)}/inventory-history`,
} as const;

/**
 * 아직 백엔드에 없는 엔드포인트.
 *
 * 여기 담긴 키는 http 구현이 호출을 시도하지 않고 즉시 폴백한다.
 * 백엔드에 라우터가 생기면 이 배열에서 이름만 빼면 실제 호출로 전환된다.
 * (연동 순서를 코드 한 줄로 통제하기 위한 장치)
 */
export const NOT_YET_IMPLEMENTED: ReadonlyArray<keyof typeof ENDPOINTS> = [
  'cameras',
  'permissions',
  'inventoryHistory',
];

export function isImplemented(name: keyof typeof ENDPOINTS): boolean {
  return !NOT_YET_IMPLEMENTED.includes(name);
}
