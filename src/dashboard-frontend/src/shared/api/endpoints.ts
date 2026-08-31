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

  /**
   * 작업 실패로 스스로 멈춘(blocked) 팔을 다시 지시를 받는 상태로 되돌린다.
   * 본문이 없고 여러 번 눌러도 같은 결과라, 팝업에서 재시도해도 안전하다.
   */
  resumeRobot: (robotId: string) => `/robots/${encodeURIComponent(robotId)}/resume`,

  /** 관리자가 카메라로 확인한 부품 현황을 직접 지정한다. 로봇 동작까지 이어진다. */
  lineStock: (lineId: string) => `/lines/${encodeURIComponent(lineId)}/stock`,

  /** lineStock의 칸(bin) 단위 버전 — bins가 있는 라인(line-a)만 쓴다. */
  binStock: (lineId: string, binId: string) =>
    `/lines/${encodeURIComponent(lineId)}/bins/${encodeURIComponent(binId)}/stock`,

  /** 비전 판정 대 관리자 판정 기록. 객체 인식 모델 재학습 라벨로 쌓인다. */
  detectionFeedback: () => '/detection-feedback',

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
 *
 * cameras/permissions/inventoryHistory/detectionFeedback은 T1BE#27(PR #28)에서
 * 전부 구현돼 비웠다. cameras는 아직 실제 카메라가 배선되지 않아 응답이 전부
 * `online:false`로 오는데, 그건 이 배열과 무관한 정상 상태다 — 프론트는 그
 * 경우 자리표시자를 보여주도록 이미 구현돼 있다.
 *
 * lineStock은 넣지 않는다(앞으로도 마찬가지). 폴백할 안전한 기본값이 없는
 * 명령이기 때문이다. 관리자가 "부족으로 바꿔라"를 눌렀는데 조용히 아무 일도
 * 안 일어나는 것보다, 404로 실패해 화면에 오류가 뜨는 편이 낫다.
 */
export const NOT_YET_IMPLEMENTED: ReadonlyArray<keyof typeof ENDPOINTS> = [];

export function isImplemented(name: keyof typeof ENDPOINTS): boolean {
  return !NOT_YET_IMPLEMENTED.includes(name);
}
