import { SHORTAGE_STATUS_LABEL, toneForShortageStatus } from '../../shared/domain/statusTone';
import type { Line, ShortageEvent } from '../../shared/domain/types';
import { Badge, Card, EmptyState, StatusLed } from '../../shared/ui';
import { formatElapsed } from '../../shared/utils/formatTime';
import styles from './ActiveOperations.module.css';

interface ActiveOperationsProps {
  shortageEvents: ShortageEvent[];
  lines: Record<string, Line>;
}

/**
 * 지금 로봇이 수행 중인 보충 작업.
 *
 * 승인 대기(pending_approval)는 넣지 않는다. 아직 아무 동작도 시작되지 않았고,
 * 그 건은 승인 팝업이 맡는다. 여기 들어오는 것은 관리자가 이미 승인해서
 * 로봇이 실제로 움직이고 있는 건뿐이다.
 *
 * 옆의 로봇 동작 현황과 층위가 다르다 — 그쪽은 "어느 로봇이 무엇을 하고 있나"(장비 기준),
 * 여기는 "어느 라인의 어떤 부품이 언제 도착하나"(작업 기준)다.
 */
const IN_FLIGHT_STATUSES = new Set<ShortageEvent['status']>(['dispatched', 'in_transit']);

export function ActiveOperations({ shortageEvents, lines }: ActiveOperationsProps) {
  const operations = shortageEvents
    .filter((event) => IN_FLIGHT_STATUSES.has(event.status))
    // 오래 걸리고 있는 건이 위로 온다. 지연을 먼저 눈치채게 하려는 순서다.
    .sort((a, b) => (a.approvedAt ?? a.detectedAt).localeCompare(b.approvedAt ?? b.detectedAt));

  return (
    <Card
      title="진행 중인 동작"
      subtitle="승인 후 로봇이 수행 중인 보충 작업"
      fill
      action={
        operations.length > 0 ? (
          <Badge tone="accent" led pulse>
            {operations.length}건 진행 중
          </Badge>
        ) : (
          <Badge tone="idle">진행 중 없음</Badge>
        )
      }
    >
      {operations.length === 0 ? (
        <EmptyState
          message="진행 중인 보충 작업이 없습니다."
          hint="승인이 이뤄지면 로봇 동작이 여기에 표시됩니다."
        />
      ) : (
        <ul className={styles.list}>
          {operations.map((event) => {
            const tone = toneForShortageStatus(event.status);
            const startedAt = event.approvedAt ?? event.detectedAt;

            return (
              <li key={event.id} className={styles.item} data-tone={tone}>
                <StatusLed tone={tone} pulse />
                <div className={styles.body}>
                  <p className={styles.headline}>{lines[event.lineId]?.name ?? event.lineId}</p>
                  <p className={styles.detail}>
                    {event.partName} · {event.requiredQty}개
                  </p>
                </div>
                <div className={styles.trailing}>
                  <Badge tone={tone}>{SHORTAGE_STATUS_LABEL[event.status]}</Badge>
                  <time className={styles.time} dateTime={startedAt}>
                    {formatElapsed(startedAt)} 시작
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
