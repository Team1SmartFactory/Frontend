import { useFactoryStore } from '../../store/useFactoryStore';
import { useUiStore } from '../../store/useUiStore';
import { selectActiveShortageLineIds } from '../../store/selectors';
import { Badge, PageHeader } from '../../shared/ui';
import { FactoryMap } from './FactoryMap';
import { MapLegend } from './MapLegend';
import { ShortageSidePanel } from './ShortageSidePanel';
import styles from './FloorPlanTab.module.css';

/**
 * 평면도 탭: 생산라인/로봇 위치 실시간 중계 + 부족 라인 LED 표시.
 * 라인을 선택하면 우측 패널에 부족 상세와 카메라 뷰를 보여준다.
 */
export function FloorPlanTab() {
  const lines = useFactoryStore((state) => state.lines);
  const robots = useFactoryStore((state) => state.robots);
  const shortageEvents = useFactoryStore((state) => state.shortageEvents);
  const inventoryHistory = useFactoryStore((state) => state.inventoryHistory);
  const selectedLineId = useUiStore((state) => state.selectedLineId);
  const selectLine = useUiStore((state) => state.selectLine);

  const shortageLineIds = selectActiveShortageLineIds(shortageEvents);
  const selectedLine = selectedLineId ? lines[selectedLineId] : undefined;

  return (
    <div className={styles.page}>
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

        {selectedLineId && (
          <ShortageSidePanel
            line={selectedLine}
            shortageEvents={Object.values(shortageEvents).filter((event) => event.lineId === selectedLineId)}
            history={inventoryHistory[selectedLineId] ?? []}
            onClose={() => selectLine(null)}
          />
        )}
      </div>
    </div>
  );
}
