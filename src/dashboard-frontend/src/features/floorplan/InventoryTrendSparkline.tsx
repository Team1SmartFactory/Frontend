import type { InventoryPoint } from '../../store/useFactoryStore';
import type { Tone } from '../../shared/ui/tone';
import styles from './InventoryTrendSparkline.module.css';

interface InventoryTrendSparklineProps {
  points: InventoryPoint[];
  /** 임계치(0~100). 기준선을 그려 추세가 어디로 향하는지 읽히게 한다. */
  threshold: number;
  tone?: Tone;
}

const WIDTH = 280;
const HEIGHT = 64;

/** 값(0~100)을 SVG y좌표로. 위가 100%가 되도록 뒤집는다. */
function toY(qty: number): number {
  return HEIGHT - (Math.max(0, Math.min(100, qty)) / 100) * HEIGHT;
}

/**
 * 라인 상세의 재고 추이 스파크라인.
 * 단일 지표(면적 %)의 짧은 추세만 보여주므로 범례와 축을 두지 않고,
 * 대신 임계치 기준선과 마지막 값 마커로 현재 위치를 읽게 한다.
 */
export function InventoryTrendSparkline({ points, threshold, tone = 'accent' }: InventoryTrendSparklineProps) {
  if (points.length < 2) {
    return <p className={styles.empty}>추이 데이터 수집 중…</p>;
  }

  const step = WIDTH / (points.length - 1);
  const coords = points.map((point, index) => ({ x: index * step, y: toY(point.qty) }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const last = coords[coords.length - 1];
  const lastPoint = points[points.length - 1];
  const thresholdY = toY(threshold);

  return (
    <figure className={styles.figure} data-tone={tone}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.chart}
        preserveAspectRatio="none"
        role="img"
        aria-label={`재고 추이. 현재 ${lastPoint?.qty.toFixed(0)}퍼센트, 임계치 ${threshold}퍼센트`}
      >
        <line x1={0} y1={thresholdY} x2={WIDTH} y2={thresholdY} className={styles.thresholdLine} />
        <path d={area} className={styles.area} />
        <path d={line} className={styles.line} />
        {last && <circle cx={last.x} cy={last.y} r={3} className={styles.marker} />}
      </svg>

      <figcaption className={styles.caption}>
        <span className={styles.value}>{lastPoint?.qty.toFixed(0)}%</span>
        <span className={styles.thresholdLabel}>임계치 {threshold}%</span>
      </figcaption>
    </figure>
  );
}
