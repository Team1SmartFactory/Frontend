import type { RobotStatus, RobotType } from '../../shared/domain/types';
import { ROBOT_STATE_LABEL, toneForRobotState } from '../../shared/domain/statusTone';
import { Badge, Card, EmptyState, StatusLed } from '../../shared/ui';
import styles from './RobotActivityPanel.module.css';

interface RobotActivityPanelProps {
  robots: RobotStatus[];
}

/** 명세의 "omx, 비글 분리" 요구에 따라 로봇을 두 계열로 나눈다. */
const GROUPS: { key: string; label: string; types: RobotType[] }[] = [
  { key: 'beagle', label: 'Beagle (운반)', types: ['beagle'] },
  { key: 'omxf', label: 'OMX-F (적재·하역)', types: ['omxf_storage', 'omxf_line'] },
];

/**
 * 동작 중으로 볼 상태. 이 목록에 없으면 대기/오프라인으로 접어 둔다.
 * 정지(blocked)한 팔은 움직이지 않지만 '대기 N대'로 접으면 사라져 버린다 —
 * 사람이 복구를 눌러 줘야 하는 상태이므로 항상 펼쳐 보여야 한다.
 */
const ACTIVE_STATES = new Set<RobotStatus['state']>(['moving', 'working', 'error', 'blocked']);

/** 점멸은 "지금 움직이는 중"이라는 뜻이다. 멈춰 선 상태(오류·정지)는 점멸하지 않는다. */
const STILL_STATES = new Set<RobotStatus['state']>(['error', 'blocked']);

/**
 * 로봇 동작 현황 섹션.
 * 전체 목록을 나열하면 화면이 길어지므로, 동작 중인 로봇만 펼치고
 * 나머지는 계열별 대기 대수로 요약한다.
 */
export function RobotActivityPanel({ robots }: RobotActivityPanelProps) {
  const activeCount = robots.filter((robot) => ACTIVE_STATES.has(robot.state)).length;

  return (
    <Card
      title="로봇 동작 현황"
      subtitle="동작 중인 로봇만 표시"
      fill
      action={
        <Badge tone={activeCount > 0 ? 'accent' : 'idle'} led={activeCount > 0}>
          동작 {activeCount} / 전체 {robots.length}
        </Badge>
      }
    >
      <div className={styles.groups}>
        {GROUPS.map((group) => {
          const members = robots.filter((robot) => group.types.includes(robot.type));
          const active = members.filter((robot) => ACTIVE_STATES.has(robot.state));
          const idleCount = members.length - active.length;

          return (
            <section key={group.key} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.label}</h3>

              {active.length === 0 ? (
                <p className={styles.allIdle}>전 대수 대기 중 ({members.length}대)</p>
              ) : (
                <ul className={styles.list}>
                  {active.map((robot) => (
                    <li key={robot.robotId} className={styles.item} data-tone={toneForRobotState(robot.state)}>
                      <StatusLed tone={toneForRobotState(robot.state)} pulse={!STILL_STATES.has(robot.state)} size="sm" />
                      <span className={styles.robotId}>{robot.robotId}</span>
                      <span className={styles.state}>{ROBOT_STATE_LABEL[robot.state]}</span>
                    </li>
                  ))}
                </ul>
              )}

              {active.length > 0 && idleCount > 0 && <p className={styles.idleNote}>대기 {idleCount}대</p>}
            </section>
          );
        })}

        {robots.length === 0 && <EmptyState message="연결된 로봇이 없습니다." />}
      </div>
    </Card>
  );
}
