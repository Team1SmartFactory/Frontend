import type { Kpi, Snapshot } from '../domain/schemas';
import type {
  Bin,
  Camera,
  DetectionFeedbackInput,
  InventoryPoint,
  Line,
  Permissions,
  RobotStatus,
  ShortageEvent,
  StockVerdict,
} from '../domain/types';

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

  /** 운영 지표 집계 (리드타임·성공률). KPI 카드가 주기적으로 다시 읽는다. */
  fetchKpi(signal?: AbortSignal): Promise<Kpi>;

  /** 승인 → 보관소 OMX-F 적재 + Beagle 운반 지시 */
  approveShortage(input: { id: string; approvedBy: string }): Promise<ShortageEvent>;

  /** 반려 → 감지가 틀렸다고 보고 라인을 정상으로 되돌린다 */
  rejectShortage(input: { id: string }): Promise<ShortageEvent>;

  /**
   * 반려했던 건을 되살려 바로 보충을 지시한다 (이슈 #46).
   * 승인과 같은 준비 관문(창고 부품·비글 카메라 판정)을 거치므로 409가 날 수 있다.
   */
  restockShortage(input: { id: string; approvedBy: string }): Promise<ShortageEvent>;

  /** 반려로 닫힌 건을 완전히 지운다. 활성 건은 서버가 409로 거절한다. */
  deleteShortage(input: { id: string }): Promise<void>;

  /**
   * 작업 실패로 스스로 멈춘 팔을 다시 지시를 받는 상태로 되돌린다.
   *
   * 응답은 그 로봇의 현재 상태다 — 복구가 먹혔는지를 응답만으로 판단하지는
   * 않지만(WebSocket이 최종 근거다), 버튼을 누른 직후 화면을 맞추는 데 쓴다.
   */
  resumeRobot(input: { robotId: string }): Promise<RobotStatus>;

  /**
   * 관리자가 카메라로 확인한 결과로 라인 현황을 직접 지정한다.
   *
   * 'shortage'면 보충 작업이 곧바로 나가고, 'sufficient'면 진행 중인 건을
   * 취소하고 로봇을 되돌린다. 관리자의 명시적 지시이므로 승인 절차를 다시 타지 않는다.
   */
  overrideLineStock(input: { lineId: string; verdict: StockVerdict; by: string }): Promise<Line>;

  /** overrideLineStock의 칸(bin) 단위 버전 — bins가 있는 라인만 쓴다. */
  overrideBinStock(input: {
    lineId: string;
    binId: string;
    verdict: StockVerdict;
    by: string;
  }): Promise<Bin>;

  /**
   * 비전 판정과 관리자 판정의 대조 기록을 남긴다.
   *
   * 로봇 동작과 분리된 경로다. 학습 라벨 적재가 실패해도 승인·보충은 진행되어야 하고,
   * 반대로 라벨만 다시 보내는 것도 가능해야 하기 때문이다.
   */
  submitDetectionFeedback(input: DetectionFeedbackInput): Promise<void>;

  /** 설치된 카메라 목록 */
  fetchCameras(signal?: AbortSignal): Promise<Camera[]>;

  /** 승인 권한 설정 조회/저장 */
  fetchPermissions(signal?: AbortSignal): Promise<Permissions>;
  updatePermissions(input: Permissions): Promise<Permissions>;

  /** 라인별 재고 추이 (그래프용) */
  fetchInventoryHistory(input: { lineId: string }, signal?: AbortSignal): Promise<InventoryPoint[]>;
}
