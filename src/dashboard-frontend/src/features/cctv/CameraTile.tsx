import { CameraFeed } from '../../shared/ui';
import type { Tone } from '../../shared/ui/tone';
import styles from './CameraTile.module.css';

interface CameraTileProps {
  cameraId: string;
  label: string;
  /** 경보 단계색: critical(부족)·accent(보충 중). 없으면 강조하지 않는다 (이슈 #40). */
  alertTone?: Tone;
  alertLabel?: string;
  streamUrl?: string;
  scopeTag?: string;
  onZoom: () => void;
}

/** CCTV 오버뷰의 카메라 한 칸. 클릭하면 확대 팝업이 열린다. */
export function CameraTile({
  cameraId,
  label,
  alertTone,
  alertLabel,
  streamUrl,
  scopeTag,
  onZoom,
}: CameraTileProps) {
  return (
    <button type="button" className={styles.tile} onClick={onZoom} aria-label={`${label} 확대`}>
      <CameraFeed
        cameraId={cameraId}
        label={label}
        tone={alertTone}
        alertLabel={alertLabel}
        streamUrl={streamUrl}
        scopeTag={scopeTag}
      />
    </button>
  );
}
