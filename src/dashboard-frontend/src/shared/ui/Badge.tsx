import type { ReactNode } from 'react';
import type { Tone } from './tone';
import { StatusLed } from './StatusLed';
import styles from './Badge.module.css';

interface BadgeProps {
  tone?: Tone;
  /** 앞에 LED 점을 붙여 상태 뱃지로 쓴다. */
  led?: boolean;
  pulse?: boolean;
  children: ReactNode;
}

/** 상태·개수를 나타내는 알약형 라벨. */
export function Badge({ tone = 'idle', led = false, pulse = false, children }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {led && <StatusLed tone={tone} pulse={pulse} size="sm" />}
      {children}
    </span>
  );
}
