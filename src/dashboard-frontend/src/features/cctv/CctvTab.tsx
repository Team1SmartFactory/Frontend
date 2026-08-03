import { useFactoryStore } from '../../store/useFactoryStore';
import { useUiStore } from '../../store/useUiStore';
import { CameraTile } from './CameraTile';
import { CameraZoomModal } from './CameraZoomModal';
import styles from './CctvTab.module.css';

/** CCTV 탭: 모든 카메라를 그리드로 보여주고, 클릭 시 확대 팝업을 띄운다. */
export function CctvTab() {
  const lines = useFactoryStore((state) => state.lines);
  const zoomedCameraId = useUiStore((state) => state.zoomedCameraId);
  const zoomCamera = useUiStore((state) => state.zoomCamera);

  const cameras = Object.values(lines).map((line) => ({ id: `cam-${line.id}`, label: `${line.name} CCTV` }));
  const zoomed = cameras.find((camera) => camera.id === zoomedCameraId);

  return (
    <div className={styles.grid}>
      {cameras.map((camera) => (
        <CameraTile key={camera.id} label={camera.label} onZoom={() => zoomCamera(camera.id)} />
      ))}
      {zoomed && <CameraZoomModal label={zoomed.label} onClose={() => zoomCamera(null)} />}
    </div>
  );
}
