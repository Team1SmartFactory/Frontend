import { useCameras } from '../../shared/query/useCameras';
import { useShortageEvents } from '../../shared/query/useFactoryData';
import { useUiStore } from '../../store/useUiStore';
import { selectActiveShortageLineIds } from '../../store/selectors';
import { Badge, EmptyState, PageHeader, QueryState } from '../../shared/ui';
import { CameraTile } from './CameraTile';
import { CameraZoomModal } from './CameraZoomModal';
import styles from './CctvTab.module.css';

/**
 * CCTV 탭: 설치된 모든 카메라의 오버뷰.
 * 부족이 발생한 라인의 카메라는 테두리로 강조하고 앞으로 당겨,
 * 카메라 수가 늘어도 봐야 할 화면을 먼저 만나게 한다.
 */
export function CctvTab() {
  const { cameras, isPending, isError, error } = useCameras();
  const { shortageEvents } = useShortageEvents();
  const zoomedCameraId = useUiStore((state) => state.zoomedCameraId);
  const zoomCamera = useUiStore((state) => state.zoomCamera);

  const shortageLineIds = selectActiveShortageLineIds(shortageEvents);

  // 카메라는 서버가 주는 목록을 그대로 쓰고, 부족 여부만 실시간 상태에서 덧입힌다.
  const decorated = cameras
    .map((camera) => ({ ...camera, hasShortage: shortageLineIds.has(camera.lineId) }))
    .sort((a, b) => Number(b.hasShortage) - Number(a.hasShortage) || a.label.localeCompare(b.label));

  const zoomed = decorated.find((camera) => camera.id === zoomedCameraId);
  const alertCount = decorated.filter((camera) => camera.hasShortage).length;

  return (
    <div className={styles.page}>
      <PageHeader
        title="CCTV"
        description="카메라를 클릭하면 확대 화면이 열립니다."
        actions={
          alertCount > 0 ? (
            <Badge tone="critical" led pulse>
              주의 {alertCount}대
            </Badge>
          ) : (
            <Badge tone="good" led>
              전체 정상
            </Badge>
          )
        }
      />

      <div className={styles.scroll}>
        <QueryState
          isPending={isPending}
          isError={isError}
          error={error}
          loadingMessage="카메라 목록을 불러오는 중…"
        >
          {decorated.length === 0 ? (
            <EmptyState message="등록된 카메라가 없습니다." />
          ) : (
            <div className={styles.grid}>
              {decorated.map((camera) => (
                <CameraTile
                  key={camera.id}
                  cameraId={camera.id}
                  label={camera.label}
                  hasShortage={camera.hasShortage}
                  onZoom={() => zoomCamera(camera.id)}
                />
              ))}
            </div>
          )}
        </QueryState>
      </div>

      {zoomed && (
        <CameraZoomModal
          cameraId={zoomed.id}
          label={zoomed.label}
          hasShortage={zoomed.hasShortage}
          onClose={() => zoomCamera(null)}
        />
      )}
    </div>
  );
}
