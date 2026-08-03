import type { Line } from '../../shared/domain/types';
import styles from './LineStatusCard.module.css';

interface LineStatusCardProps {
  line: Line;
}

/** 라인별 실시간 재고 현황 카드. 상태 색은 항상 텍스트 배지와 함께 표시한다(색만으로 의미 전달 금지). */
export function LineStatusCard({ line }: LineStatusCardProps) {
  const isLow = line.currentQty <= line.threshold;
  const label = line.status === 'restocking' ? '보충 중' : isLow ? '부족' : '정상';

  return (
    <article className={styles.card} data-status={line.status} data-low={isLow}>
      <header className={styles.header}>
        <h4>{line.name}</h4>
        <span className={styles.badge}>{label}</span>
      </header>

      <div
        className={styles.barTrack}
        role="progressbar"
        aria-valuenow={Math.round(line.currentQty)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.barFill} style={{ width: `${line.currentQty}%` }} />
      </div>

      <p className={styles.qtyText}>
        {line.currentQty.toFixed(0)}% <span>/ 임계치 {line.threshold}%</span>
      </p>
    </article>
  );
}
