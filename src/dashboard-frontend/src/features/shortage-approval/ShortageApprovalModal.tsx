import { useFactoryStore } from '../../store/useFactoryStore';
import { selectPendingApprovals } from '../../store/selectors';
import { useShortageActions } from './useShortageActions';
import styles from './ShortageApprovalModal.module.css';

/**
 * "부품 부족 발생 시 관리자 승인 요청 팝업 표시 (모든 뷰 위에서)" 공통 요구사항.
 * 승인 대기 이벤트가 여러 건이면 가장 오래된 것부터 한 건씩 순서대로 노출한다.
 */
export function ShortageApprovalModal() {
  const shortageEvents = useFactoryStore((state) => state.shortageEvents);
  const lines = useFactoryStore((state) => state.lines);
  const { approve, reject, pendingId } = useShortageActions();

  const pending = selectPendingApprovals(shortageEvents);
  const current = pending[0];
  if (!current) return null;

  const line = lines[current.lineId];
  const isBusy = pendingId === current.id;

  return (
    <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-labelledby="shortage-approval-title">
      <div className={styles.dialog}>
        <p className={styles.badge}>부품 부족 승인 요청</p>
        <h2 id="shortage-approval-title">{line?.name ?? current.lineId}</h2>

        <dl className={styles.details}>
          <div>
            <dt>부품</dt>
            <dd>{current.partName}</dd>
          </div>
          <div>
            <dt>필요 수량</dt>
            <dd>{current.requiredQty}개</dd>
          </div>
          <div>
            <dt>감지 시각</dt>
            <dd>{new Date(current.detectedAt).toLocaleTimeString('ko-KR')}</dd>
          </div>
        </dl>

        {pending.length > 1 && <p className={styles.queue}>대기 중인 요청 {pending.length}건</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.reject} disabled={isBusy} onClick={() => reject(current.id)}>
            반려
          </button>
          <button type="button" className={styles.approve} disabled={isBusy} onClick={() => approve(current.id)}>
            {isBusy ? '처리 중…' : '보충 승인'}
          </button>
        </div>
      </div>
    </div>
  );
}
