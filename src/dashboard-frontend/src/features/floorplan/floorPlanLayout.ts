/**
 * 공장 도면 레이아웃 데이터.
 *
 * 도면 원본(가로형 평면도)을 SVG 좌표로 옮긴 것으로, 이 파일이 "도면의 진실"이다.
 * 컴포넌트는 여기 정의된 좌표만 읽어 그리므로, 실제 공장 배치가 바뀌면
 * 이 파일의 숫자만 고치면 되고 렌더링 코드는 손대지 않는다.
 *
 * 좌표계: 원본 도면 비율(약 3:2)을 그대로 쓴 1520 × 1010 viewBox.
 */

/** 우측 출입문이 바깥으로 열리는 호까지 담기도록 폭에 여유를 둔다. */
export const VIEW = { width: 1560, height: 1010 } as const;

/** 외벽 (도면 바깥 두꺼운 회색 테두리) */
export const SHELL = {
  outer: { x: 30, y: 28, width: 1460, height: 957 },
  thickness: 18,
} as const;

/** 출입구. 벽을 끊어 문이 열리는 방향을 호(arc)로 표시한다. */
export const DOORS = [
  { id: 'main', side: 'top', at: 630, length: 88 },
  { id: 'east-1', side: 'right', at: 110, length: 70 },
  { id: 'east-2', side: 'right', at: 545, length: 70 },
] as const;

export type EquipmentKind =
  | 'cnc'
  | 'cart'
  | 'robotArm'
  | 'cabinet'
  | 'edm'
  | 'desk'
  | 'lathe'
  | 'benchVise'
  | 'conveyor'
  | 'towerMachine'
  | 'rack'
  | 'pallet';

export interface Equipment {
  kind: EquipmentKind;
  /** 글리프 중심 좌표 */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorZone {
  /** 도메인 Line.id 와 대응. 보관소는 라인이 아니므로 null. */
  lineId: string | null;
  label: string;
  rect: { x: number; y: number; width: number; height: number };
  equipment: Equipment[];
}

/** 같은 설비를 가로로 n개 늘어놓을 때의 중심 좌표를 만든다. */
function row(
  kind: EquipmentKind,
  { count, startX, gap, y, width, height }: {
    count: number;
    startX: number;
    gap: number;
    y: number;
    width: number;
    height: number;
  },
): Equipment[] {
  return Array.from({ length: count }, (_, index) => ({
    kind,
    x: startX + index * gap,
    y,
    width,
    height,
  }));
}

/**
 * 생산라인 6개(A~F) + 재고 보관소.
 * 배치는 3열 × 2행이고, 보관소가 하단 전체 폭을 차지한다.
 */
export const FLOOR_ZONES: FloorZone[] = [
  {
    lineId: 'line-a',
    label: 'A라인',
    rect: { x: 65, y: 120, width: 482, height: 355 },
    equipment: [
      ...row('cnc', { count: 3, startX: 155, gap: 130, y: 248, width: 112, height: 92 }),
      ...row('cnc', { count: 3, startX: 155, gap: 130, y: 378, width: 112, height: 92 }),
      ...row('cart', { count: 1, startX: 508, gap: 0, y: 252, width: 42, height: 78 }),
      ...row('cart', { count: 1, startX: 508, gap: 0, y: 382, width: 42, height: 78 }),
    ],
  },
  {
    lineId: 'line-b',
    label: 'B라인',
    rect: { x: 563, y: 120, width: 419, height: 355 },
    equipment: [
      ...row('robotArm', { count: 3, startX: 652, gap: 137, y: 262, width: 96, height: 116 }),
      ...row('cabinet', { count: 3, startX: 655, gap: 137, y: 390, width: 118, height: 62 }),
    ],
  },
  {
    lineId: 'line-c',
    label: 'C라인',
    rect: { x: 998, y: 120, width: 434, height: 355 },
    equipment: [
      ...row('edm', { count: 3, startX: 1078, gap: 133, y: 262, width: 110, height: 118 },),
      ...row('desk', { count: 3, startX: 1080, gap: 133, y: 390, width: 108, height: 58 }),
    ],
  },
  {
    lineId: 'line-d',
    label: 'D라인',
    rect: { x: 65, y: 510, width: 482, height: 247 },
    equipment: row('lathe', { count: 3, startX: 163, gap: 143, y: 638, width: 138, height: 96 }),
  },
  {
    lineId: 'line-e',
    label: 'E라인',
    rect: { x: 563, y: 510, width: 419, height: 247 },
    equipment: row('benchVise', { count: 3, startX: 648, gap: 125, y: 638, width: 112, height: 96 }),
  },
  {
    lineId: 'line-f',
    label: 'F라인',
    rect: { x: 998, y: 510, width: 434, height: 247 },
    equipment: [
      { kind: 'conveyor', x: 1150, y: 645, width: 270, height: 90 },
      { kind: 'towerMachine', x: 1348, y: 628, width: 62, height: 148 },
    ],
  },
  {
    lineId: null,
    label: '재고 보관소',
    rect: { x: 65, y: 780, width: 1367, height: 175 },
    equipment: [
      ...row('rack', { count: 4, startX: 143, gap: 113, y: 892, width: 96, height: 96 }),
      ...row('pallet', { count: 5, startX: 600, gap: 88, y: 896, width: 72, height: 84 }),
      ...row('rack', { count: 2, startX: 1098, gap: 113, y: 892, width: 96, height: 96 }),
      ...row('pallet', { count: 2, startX: 1305, gap: 78, y: 896, width: 68, height: 76 }),
    ],
  },
];

/** 도메인의 0~100 상대 좌표를 도면 viewBox 좌표로 옮긴다. */
export function toViewX(percent: number): number {
  return (percent / 100) * VIEW.width;
}

export function toViewY(percent: number): number {
  return (percent / 100) * VIEW.height;
}
