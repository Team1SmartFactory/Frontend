import { useFactoryStore } from '../../store/useFactoryStore';
import { useUiStore } from '../../store/useUiStore';
import { selectActiveShortageLineIds } from '../../store/selectors';
import { Badge, EmptyState, PageHeader } from '../../shared/ui';
import { CameraTile } from './CameraTile';
import { CameraZoomModal } from './CameraZoomModal';
import styles from './CctvTab.module.css';

interface Camera {
  id: string;
  label: string;
  hasShortage: boolean;
}

/**
 * CCTV 탭: 설치된 모든 카메라의 오버뷰.
 * 부족이 발생한 라인의 카메라는 테두리로 강조하고 앞으로 당겨,
 * 카메라 수가 늘어도 봐야 할 화면을 먼저 만나게 한다.
 */
export function CctvTab() {
  const lines = useFactoryStore((state) => state.lines);
  const shortageEvents = useFactoryStore((state) => state.shortageEvents);
  const zoomedCameraId = useUiStore((state) => state.zoomedCameraId);
  const zoomCamera = useUiStore((state) => state.zoomCamera);

  const shortageLineIds = selectActiveShortageLineIds(shortageEvents);

  const cameras: Camera[] = Object.values(lines)
    .map((line) => ({
      id: `cam-${line.id}`,
      label: `${line.name} 천장 카메라`,
      hasShortage: shortageLineIds.has(line.id),
    }))
    .sort((a, b) => Number(b.hasShortage) - Number(a.hasShortage) || a.label.localeCompare(b.label));

  const zoomed = cameras.find((camera) => camera.id === zoomedCameraId);
  const alertCount = cameras.filter((camera) => camera.hasShortage).length;

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
        {cameras.length === 0 ? (
          <EmptyState message="등록된 카메라가 없습니다." />
        ) : (
          <div className={styles.grid}>
            {cameras.map((camera) => (
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
