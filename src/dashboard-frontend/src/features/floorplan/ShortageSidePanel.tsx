import type { Line, ShortageEvent } from '../../shared/domain/types';
import {
  SHORTAGE_STATUS_LABEL,
  isOpenShortage,
  toneForLine,
  toneForShortageStatus,
} from '../../shared/domain/statusTone';
import { useCameras } from '../../shared/query/useCameras';
import { useInventoryHistory } from '../../shared/query/useInventoryHistory';
import { Badge, Button, CameraFeed, EmptyState, StatusLed } from '../../shared/ui';
import { CloseIcon } from '../../shared/ui/icons';
import { formatElapsed } from '../../shared/utils/formatTime';
import { InventoryTrendSparkline } from './InventoryTrendSparkline';
import styles from './ShortageSidePanel.module.css';

interface ShortageSidePanelProps {
  line: Line;
  shortageEvents: ShortageEvent[];
  onClose: () => void;
}

/** 선택한 라인의 부족 부품·수량과 실시간 카메라 뷰를 보여주는 사이드 패널. */
export function ShortageSidePanel({ line, shortageEvents, onClose }: ShortageSidePanelProps) {
  // 이력과 카메라는 이 패널에서만 쓰므로 여기서 직접 조회한다.
  // 상위 탭이 모든 라인의 이력을 들고 있다가 내려줄 이유가 없다.
  const { history } = useInventoryHistory(line.id);
  const { cameras } = useCameras();

  const tone = toneForLine(line);
  const camera = cameras.find((item) => item.lineId === line.id);
  const sorted = [...shortageEvents].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  // 진행 중인 건만 "가져와야 할 부품"으로 본다. 완료·반려는 이력으로 내린다.
  const openEvents = sorted.filter((event) => isOpenShortage(event.status));
  const pastEvents = sorted.filter((event) => !isOpenShortage(event.status));

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
          {camera ? (
            <CameraFeed
              cameraId={camera.id}
              label={camera.label}
              tone={tone === 'critical' ? 'critical' : undefined}
              alertLabel="부품 부족"
            />
          ) : (
            <EmptyState message="이 라인에 연결된 카메라가 없습니다." />
          )}
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
