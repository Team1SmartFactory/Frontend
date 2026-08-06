import { useLines, useShortageEvents } from '../../shared/query/useFactoryData';
import { useCameras } from '../../shared/query/useCameras';
import { usePermissions } from '../../shared/query/useSettings';
import { selectPendingApprovals } from '../../store/selectors';
import { Badge, Button, CameraFeed, EmptyState, StatusLed } from '../../shared/ui';
import { formatClock } from '../../shared/utils/formatTime';
import { useAutoApproval } from './useAutoApproval';
import { useShortageActions } from './useShortageActions';
import styles from './ShortageApprovalModal.module.css';

/**
 * "부품 부족 발생 시 관리자 승인 요청 팝업 표시 (모든 뷰 위에서)" 공통 요구사항.
 *
 * 승인 대기가 여러 건이면 가장 오래된 것부터 한 건씩 노출한다.
 * 설정에서 승인 필수를 끄면 팝업 대신 자동 승인으로 넘어간다.
 *
 * 라인명 바로 아래에 해당 라인의 카메라를 띄운다. 수치만 보고 판단하면
 * 비전이 틀렸을 때 관리자도 같이 틀리므로, 승인/반려 버튼과 근거를 한 화면에 둔다.
 */
export function ShortageApprovalModal() {
  const { shortageEvents } = useShortageEvents();
  const { lines } = useLines();
  const { cameras } = useCameras();
  const { permissions } = usePermissions();
  const { approve, reject, autoApprove, pendingId } = useShortageActions();

  const approvalRequired = permissions.approvalRequired;
  const pending = selectPendingApprovals(shortageEvents);

  useAutoApproval(pending, !approvalRequired, autoApprove);

  const current = pending[0];
  if (!approvalRequired || !current) return null;

  const line = lines[current.lineId];
  const camera = cameras.find((item) => item.lineId === current.lineId);
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

        <div className={styles.camera}>
          {camera ? (
            <CameraFeed
              cameraId={camera.id}
              label={camera.label}
              tone="critical"
              alertLabel="부품 부족"
              streamUrl={camera.streamUrl}
            />
          ) : (
            <EmptyState
              message="이 라인에 연결된 카메라가 없습니다."
              hint="현장을 직접 확인한 뒤 판단해 주세요."
            />
          )}
        </div>

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
          카메라로 보기에 부족이 아니라면 반려하세요 — 라인은 정상으로 돌아가고,
          이 판단은 객체 인식 모델 학습에 반영됩니다.
        </p>

        <div className={styles.actions}>
          <Button variant="secondary" disabled={isBusy} onClick={() => reject(current)}>
            반려
          </Button>
          <Button variant="primary" disabled={isBusy} onClick={() => approve(current)}>
            {isBusy ? '처리 중…' : '보충 승인'}
          </Button>
        </div>
      </div>
    </div>
  );
}
