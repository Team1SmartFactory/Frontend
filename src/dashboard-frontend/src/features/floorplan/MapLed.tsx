import type { Tone } from '../../shared/ui/tone';
import styles from './MapLed.module.css';

interface MapLedProps {
  tone: Tone;
  /** 조치가 필요한 상태에만 켠다. 상시 점멸은 오히려 주의를 분산시킨다. */
  pulse?: boolean;
  /** 코어 반지름 (평면도 viewBox 단위). 헤일로는 이 값에 비례해 커진다. */
  radius?: number;
}

/**
 * 평면도 위에 얹는 SVG LED 인디케이터.
 *
 * 실제 표시등처럼 보이도록 "밝은 코어 + 확산 헤일로" 2층으로 구성한다.
 * 코어는 작게 유지해 위치를 정확히 가리키고, 시인성은 발광이 담당한다.
 * (HTML 요소용 LED는 shared/ui/StatusLed 를 쓴다.)
 */
export function MapLed({ tone, pulse = false, radius = 0.9 }: MapLedProps) {
  return (
    <g className={pulse ? styles.ledPulse : styles.led} data-tone={tone}>
      <circle r={radius * 3} className={styles.halo} />
      <circle r={radius * 1.7} className={styles.bloom} />
      <circle r={radius} className={styles.core} />
    </g>
  );
}
