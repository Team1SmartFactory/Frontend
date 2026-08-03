import type { Line, ShortageEvent } from '../../shared/domain/types';
import type { InventoryPoint } from '../../store/useFactoryStore';
import { SHORTAGE_STATUS_LABEL, toneForLine, toneForShortageStatus } from '../../shared/domain/statusTone';
import { Badge, Button, CameraFeed, EmptyState, StatusLed } from '../../shared/ui';
import { CloseIcon } from '../../shared/ui/icons';
import { formatElapsed } from '../../shared/utils/formatTime';
import { InventoryTrendSparkline } from './InventoryTrendSparkline';
import styles from './ShortageSidePanel.module.css';

interface ShortageSidePanelProps {
  line?: Line;
  shortageEvents: ShortageEvent[];
  history: InventoryPoint[];
  onClose: () => void;
}

/** 진행 중인 건만 "가져와야 할 부품"으로 본다. 완료·반려는 이력으로 내린다. */
const OPEN_STATUSES = new Set<ShortageEvent['status']>(['pending_approval', 'dispatched', 'in_transit']);

/** 선택한 라인의 부족 부품·수량과 실시간 카메라 뷰를 보여주는 사이드 패널. */
export function ShortageSidePanel({ line, shortageEvents, history, onClose }: ShortageSidePanelProps) {
  if (!line) return null;

  const tone = toneForLine(line);
  const sorted = [...shortageEvents].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  const openEvents = sorted.filter((event) => OPEN_STATUSES.has(event.status));
  const pastEvents = sorted.filter((event) => !OPEN_STATUSES.has(event.status));

  return (
    <aside className={styles.panel} aria-label={`${line.name} 상세 정보`}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <StatusLed tone={tone} pulse={tone === 'critical'} />
          <h2 className={styles.title}>{line.name}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="패널 닫기">
          <CloseIcon size={1.1} />
        </Button>
      </header>

      <div className={styles.scroll}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>재고 추이</h3>
          <InventoryTrendSparkline points={history} threshold={line.threshold} tone={tone} />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>가져올 부품</h3>
          {openEvents.length === 0 ? (
            <EmptyState message="보충이 필요한 부품이 없습니다." />
          ) : (
            <ul className={styles.partList}>
              {openEvents.map((event) => (
                <li key={event.id} className={styles.part} data-tone={toneForShortageStatus(event.status)}>
                  <div className={styles.partBody}>
                    <p className={styles.partName}>{event.partName}</p>
                    <p className={styles.partMeta}>{formatElapsed(event.detectedAt)} 감지</p>
                  </div>
                  <span className={styles.partQty}>{event.requiredQty}개</span>
                  <Badge tone={toneForShortageStatus(event.status)}>{SHORTAGE_STATUS_LABEL[event.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>실시간 카메라</h3>
          <CameraFeed
            cameraId={`cam-${line.id}`}
            label={`${line.name} 천장 카메라`}
            tone={tone === 'critical' ? 'critical' : undefined}
            alertLabel="부품 부족"
          />
        </section>

        {pastEvents.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>지난 이력</h3>
            <ul className={styles.historyList}>
              {pastEvents.map((event) => (
                <li key={event.id} className={styles.historyItem}>
                  <span className={styles.historyPart}>{event.partName}</span>
                  <Badge tone={toneForShortageStatus(event.status)}>{SHORTAGE_STATUS_LABEL[event.status]}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
