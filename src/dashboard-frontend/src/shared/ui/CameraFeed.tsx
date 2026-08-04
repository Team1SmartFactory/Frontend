import type { Tone } from './tone';
import styles from './CameraFeed.module.css';

interface CameraFeedProps {
  cameraId: string;
  label: string;
  /** 부족 발생 라인의 카메라는 테두리로 강조한다. 없으면 강조하지 않는다. */
  tone?: Tone;
  /** 강조 사유. 테두리 색만으로 의미가 전달되지 않도록 뱃지 문구로 함께 노출한다. */
  alertLabel?: string;
}

/**
 * 카메라 화면 자리표시자.
 * 실제 스트림(RTSP/WebRTC)이 붙기 전까지의 대체 표시이며,
 * 평면도 사이드 패널과 CCTV 탭이 같은 모양을 쓰도록 공용 컴포넌트로 둔다.
 */
export function CameraFeed({ cameraId, label, tone, alertLabel }: CameraFeedProps) {
  return (
    <div className={styles.feed} data-tone={tone} data-alert={Boolean(tone)}>
      <div className={styles.viewport} aria-hidden="true" />

      <div className={styles.overlay}>
        <span className={styles.live}>
          <span className={styles.liveDot} />
          LIVE
        </span>
        {alertLabel && tone && <span className={styles.alert}>{alertLabel}</span>}
      </div>

      <div className={styles.caption}>
        <span className={styles.label}>{label}</span>
        <span className={styles.cameraId}>{cameraId}</span>
      </div>
    </div>
  );
}
