import { useLines, useRobots, useShortageEvents } from '../../shared/query/useFactoryData';
import { selectPendingApprovals, sortLinesByPriority } from '../../store/selectors';
import { Card, PageHeader, QueryState } from '../../shared/ui';
import { ActionLog } from './ActionLog';
import { LineStatusCard } from './LineStatusCard';
import { RobotActivityPanel } from './RobotActivityPanel';
import { ShortageNotifications } from './ShortageNotifications';
import { SummaryStrip } from './SummaryStrip';
import styles from './DashboardTab.module.css';

/**
 * 기본 대시보드 탭.
 *
 * 명세의 네 섹션(알림 / 부품 현황 / 로봇 동작 현황 / 액션 로그)을
 * "요약 → 조치 필요 → 상세" 순서로 배치해, 위에서 아래로 읽으면
 * 평면도를 열지 않고도 전체 상황이 파악되게 한다.
 */
export function DashboardTab() {
  const { lines, isPending, isError, error, refetch } = useLines();
  const { robots } = useRobots();
  const { shortageEvents } = useShortageEvents();

  const lineList = Object.values(lines);
  const robotList = Object.values(robots);
  const eventList = Object.values(shortageEvents);
  const sortedLines = sortLinesByPriority(lineList);
  const pendingApprovals = selectPendingApprovals(shortageEvents);

  return (
    <div className={styles.page}>
      <PageHeader title="대시보드" description="생산라인 재고와 로봇 동작을 한 화면에서 확인합니다." />

      <div className={styles.scroll}>
        <QueryState
          isPending={isPending}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
          loadingMessage="공장 현황을 불러오는 중…"
        >
          <SummaryStrip lines={lineList} robots={robotList} pendingCount={pendingApprovals.length} />

          <ShortageNotifications pendingEvents={pendingApprovals} lines={lines} />

          <Card
            title="부품 현황"
            subtitle="라인별 실시간 부품 적재 면적 · 부족 라인이 앞에 옵니다"
          >
            <div className={styles.lineGrid}>
              {sortedLines.map((line) => (
                <LineStatusCard key={line.id} line={line} />
              ))}
            </div>
          </Card>

          <div className={styles.columns}>
            <RobotActivityPanel robots={robotList} />
            <ActionLog shortageEvents={eventList} lines={lines} />
          </div>
        </QueryState>
      </div>
    </div>
  );
}
