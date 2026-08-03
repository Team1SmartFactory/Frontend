import type { Tone } from './tone';
import styles from './Meter.module.css';

interface MeterProps {
  /** 0~100 */
  value: number;
  /** 임계치 눈금 위치(0~100). 넘기면 막대 위에 기준선을 그린다. */
  threshold?: number;
  tone?: Tone;
  label: string;
}

/**
 * 재고 면적 비율 막대.
 * 임계치를 눈금으로 함께 그려, 수치를 읽지 않아도 여유분을 가늠할 수 있게 한다.
 */
export function Meter({ value, threshold, tone = 'accent', label }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={styles.track}
      data-tone={tone}
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
      {threshold !== undefined && (
        <div className={styles.threshold} style={{ left: `${Math.max(0, Math.min(100, threshold))}%` }} />
      )}
    </div>
  );
}
