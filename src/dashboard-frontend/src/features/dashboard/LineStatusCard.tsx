import type { Line } from '../../shared/domain/types';
import { toneForLine } from '../../shared/domain/statusTone';
import { Badge, Meter } from '../../shared/ui';
import styles from './LineStatusCard.module.css';

interface LineStatusCardProps {
  line: Line;
}

const TONE_LABEL: Record<string, string> = {
  critical: '부족',
  accent: '보충 중',
  serious: '주의',
  warning: '관찰',
  good: '정상',
};

/** 라인별 실시간 재고 현황 카드. 상태 색은 항상 텍스트 배지와 함께 표시한다(색만으로 의미 전달 금지). */
export function LineStatusCard({ line }: LineStatusCardProps) {
  const tone = toneForLine(line);
  const needsAction = tone === 'critical';

  return (
    <article className={styles.card} data-tone={tone}>
      <header className={styles.header}>
        <h3 className={styles.name}>{line.name}</h3>
        <Badge tone={tone} led pulse={needsAction}>
          {TONE_LABEL[tone] ?? '정상'}
        </Badge>
      </header>

      <div className={styles.readout}>
        <span className={styles.value}>{line.currentQty.toFixed(0)}</span>
        <span className={styles.unit}>%</span>
      </div>

      <Meter
        value={line.currentQty}
        threshold={line.threshold}
        tone={tone}
        label={`${line.name} 재고 면적 비율`}
      />

      <p className={styles.caption}>
        임계치 {line.threshold}% · 부품 적재 면적 기준
      </p>
    </article>
  );
}
