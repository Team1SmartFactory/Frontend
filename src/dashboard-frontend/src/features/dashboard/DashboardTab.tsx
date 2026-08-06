import { useState } from 'react';
import type { Line } from '../../shared/domain/types';
import { useLines, useRobots, useShortageEvents } from '../../shared/query/useFactoryData';
import { useCameras } from '../../shared/query/useCameras';
import { selectPendingApprovals, sortLinesByPriority } from '../../store/selectors';
import { Card, PageHeader, QueryState } from '../../shared/ui';
import { ShortageSidePanel } from '../floorplan/ShortageSidePanel';
import { ActionLog } from './ActionLog';
import { ActiveOperations } from './ActiveOperations';
import { ExceptionFeed } from './ExceptionFeed';
import { selectExceptions } from './exceptions';
import { LineStatusCard } from './LineStatusCard';
import { RobotActivityPanel } from './RobotActivityPanel';
import { SummaryStrip } from './SummaryStrip';
import styles from './DashboardTab.module.css';

/**
 * 기본 대시보드 탭.
 *
 * "요약 → 라인별 현황 → 지금 벌어지는 일 → 지난 기록" 순서로 배치해,
 * 위에서 아래로 읽으면 평면도를 열지 않고도 전체 상황이 파악되게 한다.
 *
 * 라인 배지를 누르면 평면도와 '같은' ShortageSidePanel이 우측에 열린다.
 * 두 탭이 라인 상세를 각자 그리면 한쪽만 고쳐도 타입 검사를 통과해 조용히 갈라지므로,
 * 컴포넌트를 그대로 재사용한다.
 */
export function DashboardTab() {
  const { lines, isPending, isError, error, refetch } = useLines();
  const { robots } = useRobots();
  const { shortageEvents } = useShortageEvents();
  const { cameras } = useCameras();

  /*
   * 선택 상태는 이 탭 안에만 둔다. 평면도의 useUiStore.selectedLineId를 같이 쓰면
   * 대시보드에서 연 패널이 평면도에도 열려 있어, 탭을 옮겼을 때 열어 둔 적 없는
   * 패널이 떠 있는 것으로 보인다.
   */
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const lineList = Object.values(lines);
  const robotList = Object.values(robots);
  const eventList = Object.values(shortageEvents);
  const sortedLines = sortLinesByPriority(lineList);
  const pendingApprovals = selectPendingApprovals(shortageEvents);
  const exceptions = selectExceptions({
    cameras,
    robots: robotList,
    lines: lineList,
    shortageEvents: eventList,
  });

  // 라인이 사라져도(목록 갱신) 패널이 빈 채로 남지 않게, 매번 현재 목록에서 찾는다.
  const selectedLine = selectedLineId ? lines[selectedLineId] : undefined;

  function handleSelect(line: Line): void {
    // 같은 배지를 다시 누르면 닫는다 — 여는 동작과 닫는 동작이 한 자리에 있다.
    setSelectedLineId((current) => (current === line.id ? null : line.id));
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <PageHeader title="대시보드" description="생산라인 재고와 로봇 동작을 한 화면에서 확인합니다." />

        <div className={styles.scroll}>
          <QueryState
            isPending={isPending}
            isError={isError}
            error={error}
            onRetry={() => void refetch()}
            loadingMessage="공장 현황을 불러오는 중…"
          >
            <SummaryStrip
              lines={lineList}
              robots={robotList}
              pendingCount={pendingApprovals.length}
            />

            <Card
              title="부품 현황"
              subtitle="라인별 실시간 부품 적재 면적 · 부족 라인이 앞에 옵니다"
            >
              <div className={styles.lineGrid}>
                {sortedLines.map((line) => (
                  <LineStatusCard
                    key={line.id}
                    line={line}
                    onSelect={handleSelect}
                    selected={line.id === selectedLineId}
                  />
                ))}
              </div>
            </Card>

            <div className={styles.feedRow}>
              <ExceptionFeed exceptions={exceptions} />
              <ActiveOperations shortageEvents={eventList} lines={lines} />
            </div>

            <div className={styles.columns}>
              <RobotActivityPanel robots={robotList} />
              <ActionLog shortageEvents={eventList} lines={lines} />
            </div>
          </QueryState>
        </div>
      </div>

      {/* 평면도와 같은 패널을 같은 자리에 둔다 — 헤더와 나란히 놓아 화면 높이를
          끝까지 채운다. 라인이 실제로 존재할 때만 연다: 패널이 자체적으로 재고
          이력을 조회하므로 line이 없는 상태로 마운트되면 빈 쿼리가 나간다. */}
      {selectedLine && (
        <ShortageSidePanel
          line={selectedLine}
          shortageEvents={eventList.filter((event) => event.lineId === selectedLine.id)}
          onClose={() => setSelectedLineId(null)}
        />
      )}
    </div>
  );
}
