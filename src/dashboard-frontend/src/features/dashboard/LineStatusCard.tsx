import { useState } from 'react';
import type { Line } from '../../shared/domain/types';
import { isTreatedAsShortage, STOCK_TONE_LABEL, toneForLine } from '../../shared/domain/statusTone';
import { Badge, Meter } from '../../shared/ui';
import { LineStockConfirmDialog } from '../line-stock/LineStockConfirmDialog';
import styles from './LineStatusCard.module.css';

interface LineStatusCardProps {
  line: Line;
}

/**
 * 라인별 실시간 재고 현황 카드. 상태 색은 항상 텍스트 배지와 함께 표시한다(색만으로 의미 전달 금지).
 *
 * 배지는 누를 수 있다. 카메라로 확인해 보니 감지가 틀렸을 때, 관리자가 여기서
 * 바로 현황을 바로잡는다. 잘못 누르면 로봇이 움직이므로 확인 팝업을 한 단계 둔다.
 */
export function LineStatusCard({ line }: LineStatusCardProps) {
  const [confirming, setConfirming] = useState(false);

  const tone = toneForLine(line);
  const needsAction = tone === 'critical';
  const label = STOCK_TONE_LABEL[tone];
  const nextLabel = isTreatedAsShortage(line) ? '정상' : '부족';

  return (
    <article className={styles.card} data-tone={tone}>
      <header className={styles.header}>
        <h3 className={styles.name}>{line.name}</h3>
        <button
          type="button"
          className={styles.badgeButton}
          onClick={() => setConfirming(true)}
          aria-label={`${line.name} 현황 ${label} — 눌러서 ${nextLabel}으로 변경`}
        >
          <Badge tone={tone} led pulse={needsAction}>
            {label}
          </Badge>
        </button>
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

      {confirming && <LineStockConfirmDialog line={line} onClose={() => setConfirming(false)} />}
    </article>
  );
}
