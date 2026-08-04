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
