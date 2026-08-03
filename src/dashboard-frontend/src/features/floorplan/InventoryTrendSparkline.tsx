import type { InventoryPoint } from '../../store/useFactoryStore';
import styles from './InventoryTrendSparkline.module.css';

interface InventoryTrendSparklineProps {
  points: InventoryPoint[];
}

const WIDTH = 160;
const HEIGHT = 40;

/**
 * 라인 상세 "재고 추이 그래프". 단일 지표(면적 %)의 짧은 추세만 보여주는
 * 스파크라인이라 범례가 필요 없다 (단일 시리즈 규칙). 값은 tabular-nums로 정렬.
 */
export function InventoryTrendSparkline({ points }: InventoryTrendSparklineProps) {
  if (points.length < 2) {
    return <p className={styles.empty}>추이 데이터 수집 중…</p>;
  }

  const step = WIDTH / (points.length - 1);
  const path = points
    .map((point, index) => {
      const x = index * step;
      const y = HEIGHT - (point.qty / 100) * HEIGHT;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = points[points.length - 1];

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.chart} role="img" aria-label="재고 추이 그래프">
        <path d={path} className={styles.line} />
      </svg>
      {last && <span className={styles.value}>{last.qty.toFixed(0)}%</span>}
    </div>
  );
}
