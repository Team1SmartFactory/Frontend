export interface Position {
  x: number;
  y: number;
}

export type LineStatus = 'normal' | 'restocking';

export interface Line {
  id: string;
  name: string;
  /** 부족 판정 임계치 (전체 면적 대비 부품 존재 면적 %) */
  threshold: number;
  /** 현재 부품 존재 면적 % (0~100) */
  currentQty: number;
  status: LineStatus;
  updatedAt: string;
  /** 평면도 상 좌표 (0~100 상대 좌표) */
  position: Position;
}

export interface InventoryEvent {
  id: string;
  lineId: string;
  qty: number;
  detectedAt: string;
}

export type ShortageEventStatus =
  | 'pending_approval'
  | 'dispatched'
  | 'in_transit'
  | 'completed'
  | 'rejected';

export interface ShortageEvent {
  id: string;
  lineId: string;
  detectedAt: string;
  status: ShortageEventStatus;
  partName: string;
  requiredQty: number;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * 라인의 부품 현황 판정.
 *
 * 비전이 내리는 판정과 관리자가 카메라를 보고 내리는 판정이 같은 어휘를 쓴다.
 * 둘을 나란히 비교해야 "감지가 틀렸다"를 데이터로 남길 수 있기 때문이다.
 */
export type StockVerdict = 'shortage' | 'sufficient';

/**
 * 관리자 판정이 나온 경로.
 *
 * 승인/반려는 감지 결과를 눈앞에 두고 내린 판단이고, 수동 토글은 알림 없이
 * 관리자가 먼저 발견한 경우다. 학습 라벨의 성격이 다르므로 구분해 보낸다.
 */
export type FeedbackSource = 'approve' | 'reject' | 'manual_toggle';

/**
 * 비전 판정과 관리자 판정을 짝지은 기록. 객체 인식 모델의 재학습 라벨로 쓰인다.
 *
 * detected === corrected면 "감지가 맞았다"는 양성 라벨이고,
 * 어긋나면 오탐(부족이 아닌데 부족) 또는 미탐(부족인데 놓침) 라벨이 된다.
 * 프론트는 라벨을 만들어 보내기만 하고, 학습 자체는 백엔드가 맡는다.
 */
export interface DetectionFeedback {
  id: string;
  lineId: string;
  /** 비전이 판정했던 값 */
  detected: StockVerdict;
  /** 관리자가 카메라로 확인한 실제 값 */
  corrected: StockVerdict;
  source: FeedbackSource;
  by: string;
  at: string;
  /** 이 판단의 계기가 된 부족 이벤트. 수동 토글이면 없다. */
  shortageEventId?: string;
}

/** 서버가 id와 시각을 채우므로, 보낼 때는 판정 내용만 담는다. */
export type DetectionFeedbackInput = Omit<DetectionFeedback, 'id' | 'at'>;

export type RobotType = 'beagle' | 'omxf_storage' | 'omxf_line';
export type RobotState = 'idle' | 'moving' | 'working' | 'error' | 'offline';

export interface RobotStatus {
  robotId: string;
  type: RobotType;
  state: RobotState;
  currentTaskId?: string;
  position: Position;
  updatedAt: string;
}

/**
 * 설치된 카메라.
 * 라인당 1대를 가정하지 않는다. 실제로는 한 라인에 여러 대가 붙을 수 있어
 * lineId를 필드로 두고 화면에서 묶는다.
 */
export interface Camera {
  id: string;
  lineId: string;
  label: string;
  /** RTSP/HLS/WebRTC 주소. 아직 스트림이 없으면 비어 있다. */
  streamUrl?: string;
  online: boolean;
}

/** 승인 권한 설정. 로봇 자동 동작 여부를 결정하므로 서버가 보관해야 한다. */
export interface Permissions {
  approvalRequired: boolean;
  authorizedApprovers: string[];
}

/**
 * 서버 값이 아직 없을 때 쓰는 기본값.
 *
 * "승인 필요"가 기본이어야 안전한 쪽으로 실패한다 — 설정을 못 읽었다고
 * 로봇이 승인 없이 움직이면 안 된다. 목 백엔드·HTTP 폴백·쿼리 폴백이
 * 각자 리터럴을 들고 있으면 셋 중 하나만 바뀌었을 때 조회 전후로 값이
 * 달라지므로, 한 곳에서만 정의한다.
 */
export const DEFAULT_PERMISSIONS: Permissions = {
  approvalRequired: true,
  authorizedApprovers: ['admin'],
};

/** 재고 추이 그래프의 한 점. */
export interface InventoryPoint {
  qty: number;
  at: string;
}
