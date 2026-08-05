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
