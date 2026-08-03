import type { Tone } from './tone';
import styles from './StatusLed.module.css';

interface StatusLedProps {
  tone: Tone;
  /** 실제 LED처럼 숨쉬듯 점멸시킨다. 조치가 필요한 상태에만 사용한다. */
  pulse?: boolean;
  size?: 'sm' | 'md';
  /** 색만으로 상태를 전달하지 않도록, 텍스트 라벨이 곁에 없을 때 반드시 넘긴다. */
  label?: string;
}

/**
 * 상태 표시용 LED 점.
 * 색상은 Tone 토큰이 결정하고, 발광은 box-shadow 3중 레이어로 만든다.
 * SVG 평면도용 발광 점은 features/floorplan/MapLed 를 쓴다.
 */
export function StatusLed({ tone, pulse = false, size = 'md', label }: StatusLedProps) {
  return (
    <span
      className={pulse ? styles.ledPulse : styles.led}
      data-tone={tone}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
