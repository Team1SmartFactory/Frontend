import { useLines, useRobots, useShortageEvents } from '../../shared/query/useFactoryData';
import { useUiStore } from '../../store/useUiStore';
import {
  selectPendingShortageBinIds,
  selectPendingShortageLineIds,
  selectRestockingBinIds,
  selectRestockingLineIds,
} from '../../store/selectors';
import { Badge, PageHeader, QueryState } from '../../shared/ui';
import { FactoryMap } from './FactoryMap';
import { MapLegend } from './MapLegend';
import { ShortageSidePanel } from './ShortageSidePanel';
import styles from './FloorPlanTab.module.css';

/**
 * 평면도 탭: 생산라인/로봇 위치 실시간 중계 + 부족 라인 LED 표시.
 * 라인을 선택하면 우측 패널에 부족 상세와 카메라 뷰를 보여준다.
 */
export function FloorPlanTab() {
  const { lines, isPending, isError, error, refetch } = useLines();
  const { robots } = useRobots();
  const { shortageEvents } = useShortageEvents();
  const selectedLineId = useUiStore((state) => state.selectedLineId);
  const selectLine = useUiStore((state) => state.selectLine);

  // 승인 대기(빨강)와 보충 중(파랑)을 갈라 든다 (이슈 #38) — 승인을 누른 뒤에도
  // 화면이 계속 '부족'으로 경보하면 관리자는 승인이 안 먹었다고 판단한다.
  const pendingLineIds = selectPendingShortageLineIds(shortageEvents);
  const restockingLineIds = selectRestockingLineIds(shortageEvents);
  const pendingBinIds = selectPendingShortageBinIds(shortageEvents);
  const restockingBinIds = selectRestockingBinIds(shortageEvents);
  const selectedLine = selectedLineId ? lines[selectedLineId] : undefined;

  return (
    <div className={styles.page}>
      <PageHeader
        title="평면도"
        description="라인을 선택하면 부족 상세와 카메라 뷰가 열립니다."
        actions={
          <>
            {pendingLineIds.size > 0 && (
              <Badge tone="critical" led pulse>
                부족 {pendingLineIds.size}개 라인
              </Badge>
            )}
            {restockingLineIds.size > 0 && (
              <Badge tone="accent" led pulse>
                보충 중 {restockingLineIds.size}개 라인
              </Badge>
            )}
            {pendingLineIds.size === 0 && restockingLineIds.size === 0 && (
              <Badge tone="good" led>
                전 라인 정상
              </Badge>
            )}
          </>
        }
      />

      <div className={styles.body}>
        <QueryState
          isPending={isPending}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
          loadingMessage="평면도를 불러오는 중…"
        >
          <div className={styles.mapArea}>
            <FactoryMap
              lines={Object.values(lines)}
              robots={Object.values(robots)}
              pendingLineIds={pendingLineIds}
              restockingLineIds={restockingLineIds}
              pendingBinIds={pendingBinIds}
              restockingBinIds={restockingBinIds}
              selectedLineId={selectedLineId}
              onSelectLine={selectLine}
            />
            <MapLegend />
          </div>

          {/* 라인이 실제로 존재할 때만 연다. 패널이 자체적으로 재고 이력을 조회하므로
              line이 없는 상태로 마운트되면 빈 쿼리가 나간다. */}
          {selectedLine && (
            <ShortageSidePanel
              line={selectedLine}
              shortageEvents={Object.values(shortageEvents).filter(
                (event) => event.lineId === selectedLine.id,
              )}
              onClose={() => selectLine(null)}
            />
          )}
        </QueryState>
      </div>
    </div>
  );
}
