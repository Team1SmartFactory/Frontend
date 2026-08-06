import { useState } from 'react';
import type { Line, ShortageEvent } from '../../shared/domain/types';
import {
  SHORTAGE_STATUS_LABEL,
  isOpenShortage,
  isTreatedAsShortage,
  toneForLine,
  toneForShortageStatus,
} from '../../shared/domain/statusTone';
import { useCameras } from '../../shared/query/useCameras';
import { useInventoryHistory } from '../../shared/query/useInventoryHistory';
import { Badge, Button, CameraFeed, EmptyState, StatusLed, Switch } from '../../shared/ui';
import { CloseIcon } from '../../shared/ui/icons';
import { formatElapsed } from '../../shared/utils/formatTime';
import { LineStockConfirmDialog } from '../line-stock/LineStockConfirmDialog';
import { InventoryTrendSparkline } from './InventoryTrendSparkline';
import styles from './ShortageSidePanel.module.css';

interface ShortageSidePanelProps {
  line: Line;
  shortageEvents: ShortageEvent[];
  onClose: () => void;
}

/**
 * 선택한 라인의 부족 부품·수량과 실시간 카메라 뷰를 보여주는 사이드 패널.
 *
 * 맨 아래에는 현황 판정 스위치를 고정으로 둔다. 위에서 카메라와 이력을 확인한 뒤
 * 내리는 결정이므로 읽는 순서의 끝이 맞고, 이력이 길어져도 스크롤 없이 닿는다.
 */
export function ShortageSidePanel({ line, shortageEvents, onClose }: ShortageSidePanelProps) {
  // 이력과 카메라는 이 패널에서만 쓰므로 여기서 직접 조회한다.
  // 상위 탭이 모든 라인의 이력을 들고 있다가 내려줄 이유가 없다.
  const { history } = useInventoryHistory(line.id);
  const { cameras } = useCameras();
  const [confirming, setConfirming] = useState(false);

  const tone = toneForLine(line);
  const treatedAsShortage = isTreatedAsShortage(line);
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
              streamUrl={camera.streamUrl}
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

      {/*
        스위치의 켬/끔은 라인 데이터에서 그대로 파생된다.
        그래서 확인 팝업에서 취소하면 아무것도 바꾸지 않은 채 원래 자리로 돌아간다 —
        되돌리는 코드를 따로 쓸 필요가 없다.
      */}
      <footer className={styles.footer}>
        <Switch
          checked={treatedAsShortage}
          onChange={() => setConfirming(true)}
          label="부품 부족 상태"
          description={
            treatedAsShortage
              ? '끄면 정상으로 되돌리고 보충 작업을 취소합니다.'
              : '켜면 부족으로 바꾸고 보충 작업을 시작합니다.'
          }
        />
      </footer>

      {confirming && <LineStockConfirmDialog line={line} onClose={() => setConfirming(false)} />}
    </aside>
  );
}
