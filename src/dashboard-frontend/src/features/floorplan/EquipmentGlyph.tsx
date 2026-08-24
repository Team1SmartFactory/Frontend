import type { Equipment, EquipmentKind } from './floorPlanLayout';
import type { Tone } from '../../shared/ui/tone';
import styles from './EquipmentGlyph.module.css';

/**
 * 설비 글리프. 원본 도면의 선화(line art) 느낌을 유지하되,
 * 축소 표시에서 뭉개지지 않을 만큼만 단순화했다.
 *
 * 각 글리프는 0..w / 0..h 로컬 좌표로 그리고, 배치(중심 좌표 → 좌상단 이동)는
 * EquipmentGlyph가 일괄 처리한다. 새 설비를 추가할 때 좌표 계산을 반복하지 않게 하려는 구조다.
 */
interface GlyphProps {
  w: number;
  h: number;
}

function Cnc({ w, h }: GlyphProps) {
  const bodyW = w * 0.72;
  return (
    <>
      <rect x={0} y={h * 0.12} width={bodyW} height={h * 0.62} rx={2} />
      <rect x={w * 0.1} y={h * 0.24} width={bodyW * 0.42} height={h * 0.34} rx={1} />
      <rect x={bodyW} y={h * 0.2} width={w * 0.28} height={h * 0.44} rx={2} />
      <rect x={bodyW + w * 0.06} y={h * 0.27} width={w * 0.16} height={h * 0.14} rx={1} />
      <rect x={w * 0.04} y={h * 0.74} width={w * 0.86} height={h * 0.14} rx={1} />
    </>
  );
}

function Cart({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={w * 0.18} y={0} width={w * 0.64} height={h * 0.28} rx={1} />
      <rect x={0} y={h * 0.28} width={w} height={h * 0.56} rx={2} />
      <line x1={0} y1={h * 0.56} x2={w} y2={h * 0.56} />
      <line x1={w * 0.18} y1={h * 0.84} x2={w * 0.18} y2={h} />
      <line x1={w * 0.82} y1={h * 0.84} x2={w * 0.82} y2={h} />
    </>
  );
}

function RobotArm({ w, h }: GlyphProps) {
  return (
    <>
      {/* 관절 팔 */}
      <path d={`M${w * 0.5} ${h * 0.62} L${w * 0.34} ${h * 0.3} L${w * 0.6} ${h * 0.12}`} fill="none" />
      <circle cx={w * 0.5} cy={h * 0.62} r={w * 0.07} />
      <circle cx={w * 0.34} cy={h * 0.3} r={w * 0.055} />
      <rect x={w * 0.56} y={h * 0.06} width={w * 0.16} height={h * 0.1} rx={1} />
      {/* 받침대 */}
      <rect x={w * 0.3} y={h * 0.62} width={w * 0.4} height={h * 0.22} rx={2} />
      <rect x={w * 0.16} y={h * 0.84} width={w * 0.68} height={h * 0.16} rx={1} />
    </>
  );
}

function Cabinet({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={0} y={0} width={w} height={h * 0.82} rx={2} />
      <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h * 0.82} />
      <line x1={0} y1={h * 0.41} x2={w} y2={h * 0.41} />
      <line x1={w * 0.34} y1={h * 0.2} x2={w * 0.42} y2={h * 0.2} />
      <line x1={w * 0.58} y1={h * 0.2} x2={w * 0.66} y2={h * 0.2} />
      <line x1={w * 0.08} y1={h * 0.82} x2={w * 0.08} y2={h} />
      <line x1={w * 0.92} y1={h * 0.82} x2={w * 0.92} y2={h} />
    </>
  );
}

function Edm({ w, h }: GlyphProps) {
  return (
    <>
      {/* 컬럼 + 헤드 */}
      <rect x={w * 0.24} y={0} width={w * 0.3} height={h * 0.34} rx={1} />
      <rect x={w * 0.3} y={h * 0.34} width={w * 0.18} height={h * 0.18} />
      {/* 모니터 */}
      <rect x={w * 0.6} y={h * 0.14} width={w * 0.24} height={h * 0.18} rx={1} />
      <line x1={w * 0.72} y1={h * 0.32} x2={w * 0.72} y2={h * 0.44} />
      {/* 본체 */}
      <rect x={w * 0.06} y={h * 0.52} width={w * 0.88} height={h * 0.32} rx={2} />
      <rect x={0} y={h * 0.84} width={w} height={h * 0.16} rx={1} />
    </>
  );
}

function Desk({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={w * 0.12} y={0} width={w * 0.28} height={h * 0.34} rx={1} />
      <rect x={w * 0.52} y={h * 0.08} width={w * 0.24} height={h * 0.26} rx={1} />
      <rect x={0} y={h * 0.4} width={w} height={h * 0.46} rx={2} />
      <line x1={w * 0.5} y1={h * 0.4} x2={w * 0.5} y2={h * 0.86} />
      <line x1={w * 0.06} y1={h * 0.86} x2={w * 0.06} y2={h} />
      <line x1={w * 0.94} y1={h * 0.86} x2={w * 0.94} y2={h} />
    </>
  );
}

function Lathe({ w, h }: GlyphProps) {
  return (
    <>
      {/* 헤드스톡 + 조작반 */}
      <rect x={0} y={h * 0.14} width={w * 0.32} height={h * 0.48} rx={2} />
      <rect x={w * 0.05} y={h * 0.24} width={w * 0.15} height={h * 0.2} rx={1} />
      {/* 척 */}
      <rect x={w * 0.32} y={h * 0.3} width={w * 0.07} height={h * 0.16} />
      {/* 주축 + 공구대 */}
      <line x1={w * 0.39} y1={h * 0.38} x2={w * 0.82} y2={h * 0.38} />
      <rect x={w * 0.52} y={h * 0.4} width={w * 0.13} height={h * 0.18} rx={1} />
      {/* 심압대 */}
      <rect x={w * 0.82} y={h * 0.26} width={w * 0.14} height={h * 0.3} rx={1} />
      <line x1={w * 0.78} y1={h * 0.38} x2={w * 0.82} y2={h * 0.38} />
      {/* 베드 */}
      <rect x={w * 0.02} y={h * 0.62} width={w * 0.94} height={h * 0.2} rx={1} />
      <line x1={w * 0.14} y1={h * 0.82} x2={w * 0.14} y2={h} />
      <line x1={w * 0.82} y1={h * 0.82} x2={w * 0.82} y2={h} />
    </>
  );
}

function BenchVise({ w, h }: GlyphProps) {
  return (
    <>
      {/* 바이스 */}
      <rect x={w * 0.24} y={h * 0.34} width={w * 0.24} height={h * 0.16} rx={1} />
      <path d={`M${w * 0.48} ${h * 0.42} L${w * 0.66} ${h * 0.28}`} fill="none" />
      <circle cx={w * 0.68} cy={h * 0.26} r={w * 0.05} />
      {/* 작업대 */}
      <rect x={0} y={h * 0.5} width={w} height={h * 0.12} rx={1} />
      <line x1={w * 0.1} y1={h * 0.62} x2={w * 0.1} y2={h} />
      <line x1={w * 0.9} y1={h * 0.62} x2={w * 0.9} y2={h} />
      <line x1={w * 0.1} y1={h * 0.88} x2={w * 0.9} y2={h * 0.88} />
    </>
  );
}

function Conveyor({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={0} y={h * 0.18} width={w} height={h * 0.4} rx={2} />
      <line x1={w * 0.33} y1={h * 0.18} x2={w * 0.33} y2={h * 0.58} />
      <line x1={w * 0.66} y1={h * 0.18} x2={w * 0.66} y2={h * 0.58} />
      <rect x={w * 0.14} y={h * 0.5} width={w * 0.08} height={h * 0.06} />
      <rect x={w * 0.47} y={h * 0.5} width={w * 0.08} height={h * 0.06} />
      {/* 하부 캐비닛 */}
      <rect x={0} y={h * 0.58} width={w * 0.36} height={h * 0.32} rx={1} />
      <line x1={w * 0.18} y1={h * 0.58} x2={w * 0.18} y2={h * 0.9} />
      <line x1={w * 0.04} y1={h * 0.9} x2={w * 0.04} y2={h} />
      <line x1={w * 0.32} y1={h * 0.9} x2={w * 0.32} y2={h} />
    </>
  );
}

function TowerMachine({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={w * 0.1} y={0} width={w * 0.8} height={h * 0.16} rx={2} />
      <rect x={w * 0.24} y={h * 0.04} width={w * 0.52} height={h * 0.08} rx={1} />
      <rect x={0} y={h * 0.16} width={w} height={h * 0.84} rx={2} />
      <line x1={0} y1={h * 0.62} x2={w} y2={h * 0.62} />
      <path d={`M${w} ${h * 0.3} L${w * 1.18} ${h * 0.38}`} fill="none" />
    </>
  );
}

function Rack({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={0} y={0} width={w} height={h} rx={1} />
      <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} />
      {/* 선반 위 박스 */}
      {[0.06, 0.56].map((top) => (
        <g key={top}>
          <rect x={w * 0.08} y={h * top} width={w * 0.38} height={h * 0.36} rx={1} />
          <rect x={w * 0.54} y={h * top} width={w * 0.38} height={h * 0.36} rx={1} />
        </g>
      ))}
      <line x1={w * 0.04} y1={0} x2={w * 0.04} y2={h} />
      <line x1={w * 0.96} y1={0} x2={w * 0.96} y2={h} />
    </>
  );
}

function Pallet({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={w * 0.1} y={0} width={w * 0.8} height={h * 0.4} rx={1} />
      <rect x={w * 0.1} y={h * 0.4} width={w * 0.8} height={h * 0.4} rx={1} />
      <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h * 0.8} />
      {/* 파렛트 */}
      <rect x={0} y={h * 0.8} width={w} height={h * 0.2} rx={1} />
      <line x1={w * 0.25} y1={h * 0.8} x2={w * 0.25} y2={h} />
      <line x1={w * 0.75} y1={h * 0.8} x2={w * 0.75} y2={h} />
    </>
  );
}

/**
 * 부품 적재 칸(bin). line-a처럼 하나의 설비가 칸별 상태색을 받는 자리라
 * 가로/세로 어느 비율로 넣어도 자연스럽게 읽히도록 단순하게 그렸다 — 겉박스 +
 * 위쪽 라벨 칸 + 가운데 구분선.
 */
function Bin({ w, h }: GlyphProps) {
  return (
    <>
      <rect x={0} y={0} width={w} height={h} rx={3} />
      <rect x={w * 0.1} y={h * 0.12} width={w * 0.8} height={h * 0.2} rx={1} />
      <line x1={w * 0.1} y1={h * 0.5} x2={w * 0.9} y2={h * 0.5} />
    </>
  );
}

const GLYPHS: Record<EquipmentKind, (props: GlyphProps) => JSX.Element> = {
  cnc: Cnc,
  cart: Cart,
  robotArm: RobotArm,
  cabinet: Cabinet,
  edm: Edm,
  desk: Desk,
  lathe: Lathe,
  benchVise: BenchVise,
  conveyor: Conveyor,
  towerMachine: TowerMachine,
  rack: Rack,
  pallet: Pallet,
  bin: Bin,
};

interface EquipmentGlyphProps extends Equipment {
  /**
   * 이 설비가 대응하는 칸(bin)의 현재 상태색. binLabel이 없는 설비(칸에 안
   * 매인 일반 장비)는 항상 undefined로 넘어와 중립색을 유지한다 — "정상"일
   * 때도 굳이 색을 입히지 않는다(구역 상태 강조와 같은 규칙, tone='good'이면
   * CSS가 중립으로 둔다).
   */
  tone?: Tone;
}

/** 설비 하나를 도면 좌표에 배치해 그린다. */
export function EquipmentGlyph({ kind, x, y, width, height, tone }: EquipmentGlyphProps) {
  const Glyph = GLYPHS[kind];

  return (
    <g
      className={styles.glyph}
      data-tone={tone}
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
    >
      <Glyph w={width} h={height} />
    </g>
  );
}
