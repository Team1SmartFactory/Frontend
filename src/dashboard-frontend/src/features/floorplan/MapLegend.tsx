import type { Tone } from '../../shared/ui/tone';
import { StatusLed } from '../../shared/ui';
import styles from './MapLegend.module.css';

interface LegendEntry {
  tone: Tone;
  label: string;
  pulse?: boolean;
}

/** 색만으로 의미를 전달하지 않기 위한 범례. 평면도 위 표시와 1:1로 대응한다. */
const ENTRIES: LegendEntry[] = [
  { tone: 'critical', label: '부품 부족', pulse: true },
  { tone: 'accent', label: '부품 보충 중', pulse: true },
  { tone: 'accent', label: 'Beagle 이동 중', pulse: true },
  { tone: 'idle', label: 'Beagle 대기' },
  { tone: 'good', label: '재고 정상' },
];

/** 평면도 위에 겹쳐 두는 범례. 지도를 가리지 않도록 좌하단 구석에 배치한다. */
export function MapLegend() {
  return (
    <ul className={styles.legend} aria-label="평면도 범례">
      {ENTRIES.map((entry) => (
        <li key={entry.label} className={styles.item}>
          <StatusLed tone={entry.tone} pulse={entry.pulse} size="sm" />
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}
