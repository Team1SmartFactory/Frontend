import { isTreatedAsShortage, oppositeVerdict, toneForLine } from '../../shared/domain/statusTone';
import type { Line } from '../../shared/domain/types';
import { useCameras } from '../../shared/query/useCameras';
import { Badge, CameraFeed, ConfirmDialog } from '../../shared/ui';
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
 */
export function LineStockConfirmDialog({ line, onClose }: LineStockConfirmDialogProps) {
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
      busy={isPending}
      wide={Boolean(camera)}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      {/* 카메라가 있을 때만 2단으로 눕힌다. 없으면 예전처럼 좁은 팝업에 글만 쌓인다. */}
      <div className={styles.layout} data-split={Boolean(camera)}>
        {camera && (
          <div className={styles.camera}>
            {/*
              링은 팝업이 무엇을 하려는지가 아니라 지금 라인이 어떤 상태인지를 말한다.
              화면에 흐르는 것이 라인의 현재 모습이므로, 여기 바꿀 방향의 색을 씌우면
              보이는 것과 다른 말을 하게 된다. 평면도 사이드 패널과 같은 규칙이다.
            */}
            <CameraFeed
              cameraId={camera.id}
              label={camera.label}
              tone={toneForLine(line) === 'critical' ? 'critical' : undefined}
              alertLabel="부품 부족"
              streamUrl={camera.streamUrl}
            />
          </div>
        )}

        <div className={styles.side}>
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
        </div>
      </div>
    </ConfirmDialog>
  );
}
