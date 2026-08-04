import { CameraFeed } from '../../shared/ui';
import styles from './CameraTile.module.css';

interface CameraTileProps {
  cameraId: string;
  label: string;
  hasShortage: boolean;
  onZoom: () => void;
}

/** CCTV 오버뷰의 카메라 한 칸. 클릭하면 확대 팝업이 열린다. */
export function CameraTile({ cameraId, label, hasShortage, onZoom }: CameraTileProps) {
  return (
    <button type="button" className={styles.tile} onClick={onZoom} aria-label={`${label} 확대`}>
      <CameraFeed
        cameraId={cameraId}
        label={label}
        tone={hasShortage ? 'critical' : undefined}
        alertLabel="부품 부족"
      />
    </button>
  );
}
