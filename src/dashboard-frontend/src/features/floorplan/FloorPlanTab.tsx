import { useLines, useRobots, useShortageEvents } from '../../shared/query/useFactoryData';
import { useUiStore } from '../../store/useUiStore';
import { selectActiveShortageLineIds } from '../../store/selectors';
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

  const shortageLineIds = selectActiveShortageLineIds(shortageEvents);
  const selectedLine = selectedLineId ? lines[selectedLineId] : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <PageHeader
          title="평면도"
          description="라인을 선택하면 부족 상세와 카메라 뷰가 열립니다."
          actions={
            shortageLineIds.size > 0 ? (
              <Badge tone="critical" led pulse>
                부족 {shortageLineIds.size}개 라인
              </Badge>
            ) : (
              <Badge tone="good" led>
                전 라인 정상
              </Badge>
            )
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
                shortageLineIds={shortageLineIds}
                selectedLineId={selectedLineId}
                onSelectLine={selectLine}
              />
              <MapLegend />
            </div>
          </QueryState>
        </div>
      </div>

      {/* 헤더와 나란히 두어 화면 높이를 끝까지 채운다. 라인이 실제로 존재할 때만
          연다 — 패널이 자체적으로 재고 이력을 조회하므로 line이 없는 상태로
          마운트되면 빈 쿼리가 나간다. */}
      {selectedLine && (
        <ShortageSidePanel
          line={selectedLine}
          shortageEvents={Object.values(shortageEvents).filter(
            (event) => event.lineId === selectedLine.id,
          )}
          onClose={() => selectLine(null)}
        />
      )}
    </div>
  );
}
