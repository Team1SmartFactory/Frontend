import { isTreatedAsShortage, oppositeVerdict, STOCK_TONE_LABEL, toneForLine } from '../../shared/domain/statusTone';
import type { Bin, Line } from '../../shared/domain/types';
import { useCameras } from '../../shared/query/useCameras';
import { Badge, CameraFeed, ConfirmDialog } from '../../shared/ui';
import { useBinStockActions } from './useBinStockActions';
import { useLineStockActions } from './useLineStockActions';
import styles from './LineStockConfirmDialog.module.css';

interface LineStockConfirmDialogProps {
  line: Line;
  onClose: () => void;
}

/**
 * "현황을 변경할까요?" 확인 팝업.
 *
 * 바꿀 방향은 라인의 현재 상태에서 자동으로 정해지므로 호출부는 라인만 넘기면 된다.
 * 대시보드 뱃지와 평면도 사이드바가 같은 팝업을 쓰기 때문에, 두 화면에서
 * 문구나 동작이 갈라질 여지를 남기지 않는다.
 *
 * line.bins가 있으면(line-a처럼 칸 단위로 부품을 관리하는 라인) 라인 전체를
 * 한 번에 토글하는 게 아니라 칸별로 따로 판정한다 — BinStockList로 분기.
 */
export function LineStockConfirmDialog({ line, onClose }: LineStockConfirmDialogProps) {
  if (line.bins.length > 0) {
    return <BinStockList line={line} onClose={onClose} />;
  }
  return <SingleLineStockConfirm line={line} onClose={onClose} />;
}

function SingleLineStockConfirm({ line, onClose }: LineStockConfirmDialogProps) {
  const { setVerdict, isPending, error } = useLineStockActions();
  const { cameras } = useCameras();

  const target = oppositeVerdict(line);
  const toShortage = target === 'shortage';
  const camera = cameras.find((item) => item.lineId === line.id);

  async function handleConfirm(): Promise<void> {
    const changed = await setVerdict(line, target);
    // 실패하면 팝업을 닫지 않는다. 닫아 버리면 바뀌지 않은 것을 바뀐 줄로 읽는다.
    if (changed) onClose();
  }

  return (
    <ConfirmDialog
      title="현황을 변경할까요?"
      description={
        toShortage
          ? `${line.name} 현황을 부족으로 바꾸고 보충 작업을 바로 시작합니다.`
          : `${line.name} 현황을 정상으로 바꾸고 진행 중인 보충 작업을 취소합니다.`
      }
      confirmLabel="변경"
      confirmVariant={toShortage ? 'danger' : 'primary'}
      tone={toShortage ? 'critical' : 'good'}
      busy={isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      {camera && (
        <div className={styles.camera}>
          <CameraFeed cameraId={camera.id} label={camera.label} streamUrl={camera.streamUrl} />
        </div>
      )}

      <p className={styles.transition}>
        <Badge tone={toneForLine(line)} led>
          {isTreatedAsShortage(line) ? '부족' : '정상'}
        </Badge>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <Badge tone={toShortage ? 'critical' : 'good'} led>
          {toShortage ? '부족' : '정상'}
        </Badge>
      </p>

      <p className={styles.note}>이 판단은 객체 인식 모델 학습에 반영됩니다.</p>

      {error && (
        <p className={styles.error} role="alert">
          현황을 바꾸지 못했습니다. {error.message}
        </p>
      )}
    </ConfirmDialog>
  );
}

/**
 * line-a처럼 칸(bin) 단위로 부품을 관리하는 라인은 "라인 전체"가 아니라 칸마다
 * 따로 현황을 바꾼다. 칸 단위는 아직 카메라 미리보기·학습 라벨 연동이 없어
 * (캘리브레이션 전) 상태 목록 + 토글 버튼만 있는 축소판이다.
 */
function BinStockList({ line, onClose }: LineStockConfirmDialogProps) {
  const { setVerdict, isPending, error } = useBinStockActions();

  async function handleToggle(bin: Bin): Promise<void> {
    await setVerdict(bin, oppositeVerdict(bin));
  }

  return (
    <ConfirmDialog
      title={`${line.name} 칸별 현황`}
      description="칸마다 독립적으로 보충 작업을 시작하거나 취소합니다."
      confirmLabel="닫기"
      cancelLabel="닫기"
      tone="idle"
      busy={isPending}
      onConfirm={onClose}
      onCancel={onClose}
    >
      <ul className={styles.binList}>
        {line.bins.map((bin) => {
          const toShortage = !isTreatedAsShortage(bin);
          return (
            <li key={bin.id} className={styles.binRow}>
              <span className={styles.binLabel}>
                {bin.label.toUpperCase()}칸 · {bin.partName}
              </span>
              <button
                type="button"
                className={styles.binToggle}
                disabled={isPending}
                onClick={() => handleToggle(bin)}
                aria-label={`${bin.label}칸 현황 변경 — ${toShortage ? '부족으로' : '정상으로'}`}
              >
                <Badge tone={toneForLine(bin)} led>
                  {STOCK_TONE_LABEL[toneForLine(bin)]}
                </Badge>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className={styles.error} role="alert">
          현황을 바꾸지 못했습니다. {error.message}
        </p>
      )}
    </ConfirmDialog>
  );
}
