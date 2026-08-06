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
 * 공장 전체를 비추는 카메라(scope: 'overview')는 항상 맨 앞에 고정한다 — 개별 라인이
 * 부족해도 순서가 밀리지 않아야, 처음 들어온 관리자가 전체 그림을 먼저 보고 시작할 수 있다.
 * 그다음은 부족이 발생한 라인의 카메라를 앞으로 당겨, 카메라 수가 늘어도
 * 봐야 할 화면을 먼저 만나게 한다.
 */
export function CctvTab() {
  const { cameras, isPending, isError, error } = useCameras();
  const { shortageEvents } = useShortageEvents();
  const zoomedCameraId = useUiStore((state) => state.zoomedCameraId);
  const zoomCamera = useUiStore((state) => state.zoomCamera);

  const shortageLineIds = selectActiveShortageLineIds(shortageEvents);

  // 카메라는 서버가 주는 목록을 그대로 쓰고, 부족 여부만 실시간 상태에서 덧입힌다.
  // 전체 뷰 카메라는 특정 라인에 속하지 않으므로, 어디든 부족이 있으면 강조한다.
  const decorated = cameras
    .map((camera) => ({
      ...camera,
      hasShortage:
        camera.scope === 'overview'
          ? shortageLineIds.size > 0
          : Boolean(camera.lineId && shortageLineIds.has(camera.lineId)),
      alertLabel: camera.scope === 'overview' ? '부족 라인 있음' : '부품 부족',
      // 부족 경보와 뜻이 겹치지 않게, 특정 라인이 아닌 카메라에만 붙는 별도 태그.
      scopeTag: camera.scope === 'overview' ? '전체' : undefined,
    }))
    .sort((a, b) => {
      if (a.scope !== b.scope) return a.scope === 'overview' ? -1 : 1;
      return Number(b.hasShortage) - Number(a.hasShortage) || a.label.localeCompare(b.label);
    });

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
                  streamUrl={camera.streamUrl}
                  alertLabel={camera.alertLabel}
                  scopeTag={camera.scopeTag}
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
          streamUrl={zoomed.streamUrl}
          alertLabel={zoomed.alertLabel}
          scopeTag={zoomed.scopeTag}
          onClose={() => zoomCamera(null)}
        />
      )}
    </div>
  );
}
