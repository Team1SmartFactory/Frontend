import { useLines, useShortageEvents } from '../../shared/query/useFactoryData';
import { usePermissions } from '../../shared/query/useSettings';
import { selectPendingApprovals } from '../../store/selectors';
import { Badge, Button, StatusLed } from '../../shared/ui';
import { formatClock } from '../../shared/utils/formatTime';
import { useAutoApproval } from './useAutoApproval';
import { useShortageActions } from './useShortageActions';
import styles from './ShortageApprovalModal.module.css';

/**
 * "부품 부족 발생 시 관리자 승인 요청 팝업 표시 (모든 뷰 위에서)" 공통 요구사항.
 *
 * 승인 대기가 여러 건이면 가장 오래된 것부터 한 건씩 노출한다.
 * 설정에서 승인 필수를 끄면 팝업 대신 자동 승인으로 넘어간다.
 */
export function ShortageApprovalModal() {
  const { shortageEvents } = useShortageEvents();
  const { lines } = useLines();
  const { permissions } = usePermissions();
  const { approve, reject, pendingId } = useShortageActions();

  const approvalRequired = permissions.approvalRequired;
  const pending = selectPendingApprovals(shortageEvents);

  useAutoApproval(pending, !approvalRequired, approve);

  const current = pending[0];
  if (!approvalRequired || !current) return null;

  const line = lines[current.lineId];
  const isBusy = pendingId === current.id;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="shortage-approval-title"
      >
        <header className={styles.header}>
          <span className={styles.eyebrow}>
            <StatusLed tone="critical" pulse />
            부품 부족 승인 요청
          </span>
          {pending.length > 1 && <Badge tone="idle">대기 {pending.length}건</Badge>}
        </header>

        <h2 id="shortage-approval-title" className={styles.title}>
          {line?.name ?? current.lineId}
        </h2>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>부품</dt>
            <dd>{current.partName}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>필요 수량</dt>
            <dd>{current.requiredQty}개</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>감지 시각</dt>
            <dd>{formatClock(current.detectedAt)}</dd>
          </div>
        </dl>

        <p className={styles.note}>
          승인하면 보관소 OMX-F가 부품을 적재하고 Beagle이 해당 라인으로 운반합니다.
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" disabled={isBusy} onClick={() => reject(current.id)}>
            반려
          </Button>
          <Button variant="primary" disabled={isBusy} onClick={() => approve(current.id)}>
            {isBusy ? '처리 중…' : '보충 승인'}
          </Button>
        </div>
      </div>
    </div>
  );
}
