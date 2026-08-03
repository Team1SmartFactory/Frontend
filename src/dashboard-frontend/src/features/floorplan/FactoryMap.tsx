import type { KeyboardEvent } from 'react';
import type { Line, RobotStatus, RobotType } from '../../shared/domain/types';
import styles from './FactoryMap.module.css';

interface FactoryMapProps {
  lines: Line[];
  robots: RobotStatus[];
  shortageLineIds: Set<string>;
  selectedLineId: string | null;
  onSelectLine: (lineId: string) => void;
}

const ROBOT_LABEL: Record<RobotType, string> = {
  beagle: 'Beagle',
  omxf_storage: 'OMX-F(보관소)',
  omxf_line: 'OMX-F(라인)',
};

/**
 * 공장 평면도. 생산라인은 사각형, 로봇은 원으로 표시하며
 * 좌표(0~100)를 그대로 SVG viewBox 좌표로 사용해 위치 계산 로직을 단순하게 유지한다.
 * 로봇 위치 변경은 CSS transition으로 부드럽게 이어져 "GPS 실시간 중계"처럼 보이게 한다.
 */
export function FactoryMap({ lines, robots, shortageLineIds, selectedLineId, onSelectLine }: FactoryMapProps) {
  function handleKeyDown(event: KeyboardEvent<SVGGElement>, lineId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectLine(lineId);
    }
  }

  return (
    <div className={styles.mapWrapper}>
      <svg
        className={styles.map}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="공장 평면도"
      >
        <rect x="2" y="2" width="96" height="96" rx="2" className={styles.floor} />

        {lines.map((line) => (
          <g
            key={line.id}
            transform={`translate(${line.position.x}, ${line.position.y})`}
            className={styles.lineGroup}
            onClick={() => onSelectLine(line.id)}
            onKeyDown={(event) => handleKeyDown(event, line.id)}
            role="button"
            tabIndex={0}
            aria-label={`${line.name} 상세 보기`}
          >
            <rect
              x={-6}
              y={-6}
              width={12}
              height={12}
              rx={1.5}
              className={line.id === selectedLineId ? styles.lineBoxSelected : styles.lineBox}
            />
            {shortageLineIds.has(line.id) && <circle r={2.4} className={styles.shortageDot} />}
            <text y={11} textAnchor="middle" className={styles.lineLabel}>
              {line.name}
            </text>
          </g>
        ))}

        {robots.map((robot) => (
          <g
            key={robot.robotId}
            transform={`translate(${robot.position.x}, ${robot.position.y})`}
            className={styles.robotGroup}
          >
            <circle r={2.2} className={styles[`robot_${robot.type}`]} />
            <text y={-3.5} textAnchor="middle" className={styles.robotLabel}>
              {ROBOT_LABEL[robot.type]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
