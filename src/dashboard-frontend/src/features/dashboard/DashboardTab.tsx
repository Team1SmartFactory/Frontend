import { useFactoryStore } from '../../store/useFactoryStore';
import { selectPendingApprovals, sortLinesByPriority } from '../../store/selectors';
import { LineStatusCard } from './LineStatusCard';
import { AlertBanner } from './AlertBanner';
import { EventTimeline } from './EventTimeline';
import styles from './DashboardTab.module.css';

/**
 * 기본 대시보드 탭: 실시간 현황 + 부족 라인 최상단 정렬 + 알람 배너 + 로봇 상태 + 이벤트 타임라인.
 */
export function DashboardTab() {
  const lines = useFactoryStore((state) => state.lines);
  const robots = useFactoryStore((state) => state.robots);
  const shortageEvents = useFactoryStore((state) => state.shortageEvents);

  const sortedLines = sortLinesByPriority(Object.values(lines));
  const pendingApprovals = selectPendingApprovals(shortageEvents);

  return (
    <div className={styles.page}>
      {pendingApprovals.length > 0 && <AlertBanner count={pendingApprovals.length} />}

      <section className={styles.lineGrid} aria-label="생산라인 현황">
        {sortedLines.map((line) => (
          <LineStatusCard key={line.id} line={line} />
        ))}
      </section>

      <section className={styles.widgets}>
        <div className={styles.robotWidget} aria-label="로봇 상태">
          <h3>로봇 상태</h3>
          <ul>
            {Object.values(robots).map((robot) => (
              <li key={robot.robotId}>
                <span>{robot.robotId}</span>
                <span data-state={robot.state}>{robot.state}</span>
              </li>
            ))}
          </ul>
        </div>
        <EventTimeline shortageEvents={Object.values(shortageEvents)} />
      </section>
    </div>
  );
}
