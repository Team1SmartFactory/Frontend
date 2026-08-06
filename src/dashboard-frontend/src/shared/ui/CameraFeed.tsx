import { useEffect, useState } from 'react';
import type { Tone } from './tone';
import styles from './CameraFeed.module.css';

interface CameraFeedProps {
  cameraId: string;
  label: string;
  /** 부족 발생 라인의 카메라는 테두리로 강조한다. 없으면 강조하지 않는다. */
  tone?: Tone;
  /** 강조 사유. 테두리 색만으로 의미가 전달되지 않도록 뱃지 문구로 함께 노출한다. */
  alertLabel?: string;
  /**
   * 실제 영상 주소. 있으면 자리표시자 대신 이 주소를 <video>로 재생한다.
   * Camera.streamUrl과 같은 형식을 기대한다 — 자세한 제약은 그쪽 문서를 본다.
   */
  streamUrl?: string;
}

/**
 * 카메라 화면.
 *
 * streamUrl이 있으면 실제 영상을, 없으면 이제까지 써 온 노이즈 자리표시자를 보여준다.
 * 두 경우 모두 이 컴포넌트 하나로 처리하므로, 백엔드가 카메라별로 streamUrl을 채워 주기
 * 시작하면 화면 코드를 고치지 않고도 실제 영상으로 자연스럽게 전환된다.
 *
 * 평면도 사이드 패널·CCTV 탭·부족 승인 팝업이 같은 모양을 쓰도록 공용 컴포넌트로 둔다.
 */
export function CameraFeed({ cameraId, label, tone, alertLabel, streamUrl }: CameraFeedProps) {
  // 주소가 바뀌면 이전 실패 기록을 지운다. 재생 불가 판정이 다음 카메라까지 따라가면 안 된다.
  const [streamFailed, setStreamFailed] = useState(false);
  useEffect(() => setStreamFailed(false), [streamUrl]);

  const showStream = Boolean(streamUrl) && !streamFailed;

  return (
    <div className={styles.feed} data-tone={tone} data-alert={Boolean(tone)}>
      {showStream ? (
        // 재생 불가(잘못된 주소·지원하지 않는 코덱·연결 끊김)면 빈 검은 화면 대신
        // 자리표시자로 돌아간다. 그래야 "카메라가 있다"는 사실 자체는 계속 읽힌다.
        <video
          key={streamUrl}
          className={styles.video}
          src={streamUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-label={`${label} 실시간 영상`}
          onError={() => setStreamFailed(true)}
        />
      ) : (
        <div className={styles.viewport} aria-hidden="true" />
      )}

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
