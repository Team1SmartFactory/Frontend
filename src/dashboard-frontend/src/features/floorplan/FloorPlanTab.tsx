import { useFactoryStore } from '../../store/useFactoryStore';
import { useUiStore } from '../../store/useUiStore';
import { selectActiveShortageLineIds } from '../../store/selectors';
import { FactoryMap } from './FactoryMap';
import { ShortageSidePanel } from './ShortageSidePanel';
import styles from './FloorPlanTab.module.css';

/**
 * 평면도 탭: 생산라인/로봇 위치 실시간 중계 + 부족 라인 시각화(빨간 점 애니메이션).
 * 라인을 선택하면 사이드 패널에 부족 상세와 카메라 뷰를 보여준다.
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
    <div className={styles.layout}>
      <FactoryMap
        lines={Object.values(lines)}
        robots={Object.values(robots)}
        shortageLineIds={shortageLineIds}
        selectedLineId={selectedLineId}
        onSelectLine={selectLine}
      />
      {selectedLineId && (
        <ShortageSidePanel
          line={selectedLine}
          shortageEvents={Object.values(shortageEvents).filter((event) => event.lineId === selectedLineId)}
          history={inventoryHistory[selectedLineId] ?? []}
          onClose={() => selectLine(null)}
        />
      )}
    </div>
  );
}
