import type { Line, RobotStatus } from '../../shared/domain/types';
import { toneForLine } from '../../shared/domain/statusTone';
import type { Tone } from '../../shared/ui/tone';
import { StatusLed } from '../../shared/ui';
import styles from './SummaryStrip.module.css';

interface SummaryStripProps {
  lines: Line[];
  robots: RobotStatus[];
  pendingCount: number;
}

interface Stat {
  key: string;
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone: Tone;
}

const ACTIVE_ROBOT_STATES = new Set<RobotStatus['state']>(['moving', 'working']);

/**
 * 대시보드 최상단 요약 타일.
 * 명세의 "기본 대시보드 탭만으로도 전체 상황 파악"을 위해,
 * 세부 섹션을 읽기 전에 먼저 확인할 3개 지표를 한 줄로 고정한다.
 *
 * 추세가 아닌 현재값 하나씩이므로 차트가 아니라 수치 타일로 둔다.
 */
export function SummaryStrip({ lines, robots, pendingCount }: SummaryStripProps) {
  const shortageLines = lines.filter((line) => toneForLine(line) === 'critical');
  const activeRobots = robots.filter((robot) => ACTIVE_ROBOT_STATES.has(robot.state));

  const stats: Stat[] = [
    {
      key: 'shortage',
      label: '부족 라인',
      value: String(shortageLines.length),
      unit: `/ ${lines.length}`,
      caption: shortageLines.length > 0 ? shortageLines.map((line) => line.name).join(', ') : '전 라인 정상',
      tone: shortageLines.length > 0 ? 'critical' : 'good',
    },
    {
      key: 'pending',
      label: '승인 대기',
      value: String(pendingCount),
      unit: '건',
      caption: pendingCount > 0 ? '관리자 승인 필요' : '처리할 요청 없음',
      tone: pendingCount > 0 ? 'critical' : 'good',
    },
    {
      key: 'robots',
      label: '동작 중 로봇',
      value: String(activeRobots.length),
      unit: `/ ${robots.length}`,
      caption: activeRobots.length > 0 ? '보충 작업 진행 중' : '전 대수 대기',
      tone: activeRobots.length > 0 ? 'accent' : 'idle',
    },
  ];

  return (
    <ul className={styles.strip}>
      {stats.map((stat) => (
        <li key={stat.key} className={styles.tile} data-tone={stat.tone}>
          <div className={styles.labelRow}>
            <StatusLed tone={stat.tone} size="sm" pulse={stat.tone === 'critical'} />
            <span className={styles.label}>{stat.label}</span>
          </div>
          <p className={styles.readout}>
            <span className={styles.value}>{stat.value}</span>
            {stat.unit && <span className={styles.unit}>{stat.unit}</span>}
          </p>
          <p className={styles.caption}>{stat.caption}</p>
        </li>
      ))}
    </ul>
  );
}
