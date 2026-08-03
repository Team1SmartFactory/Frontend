import type { Line, ShortageEvent } from '../../shared/domain/types';
import type { InventoryPoint } from '../../store/useFactoryStore';
import { InventoryTrendSparkline } from './InventoryTrendSparkline';
import styles from './ShortageSidePanel.module.css';

interface ShortageSidePanelProps {
  line?: Line;
  shortageEvents: ShortageEvent[];
  history: InventoryPoint[];
  onClose: () => void;
}

const STATUS_LABEL: Record<ShortageEvent['status'], string> = {
  pending_approval: '승인 대기',
  dispatched: '보충 지시됨',
  in_transit: '운반 중',
  completed: '완료',
  rejected: '반려됨',
};

/** "부족한 부품 종류 및 가져올 개수, 실시간 카메라 뷰"를 보여주는 사이드 패널. */
export function ShortageSidePanel({ line, shortageEvents, history, onClose }: ShortageSidePanelProps) {
  if (!line) return null;

  const sortedEvents = [...shortageEvents].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));

  return (
    <aside className={styles.panel} aria-label={`${line.name} 상세 정보`}>
      <header className={styles.header}>
        <h3>{line.name}</h3>
        <button type="button" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </header>

      <p className={styles.qty}>
        현재 재고 면적 <strong>{line.currentQty.toFixed(0)}%</strong> (임계치 {line.threshold}%)
      </p>

      <section>
        <h4>재고 추이</h4>
        <InventoryTrendSparkline points={history} />
      </section>

      <section>
        <h4>실시간 카메라</h4>
        <div className={styles.cameraPlaceholder} role="img" aria-label={`${line.name} 카메라 뷰`}>
          CAM · {line.name}
        </div>
      </section>

      <section>
        <h4>부족 이력</h4>
        {sortedEvents.length === 0 && <p className={styles.empty}>기록된 부족 이벤트가 없습니다.</p>}
        <ul className={styles.eventList}>
          {sortedEvents.map((event) => (
            <li key={event.id}>
              <span className={styles.eventPart}>{event.partName}</span>
              <span className={styles.eventQty}>{event.requiredQty}개</span>
              <span className={styles.eventStatus} data-status={event.status}>
                {STATUS_LABEL[event.status]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
