import type { Line, ShortageEvent } from '../../shared/domain/types';
import { SHORTAGE_STATUS_LABEL, toneForShortageStatus } from '../../shared/domain/statusTone';
import { Badge, Card, EmptyState } from '../../shared/ui';
import { formatClock } from '../../shared/utils/formatTime';
import styles from './ActionLog.module.css';

interface ActionLogProps {
  shortageEvents: ShortageEvent[];
  lines: Record<string, Line>;
}

const MAX_VISIBLE = 20;

/** 관리자 결정이 내려진 건만 로그에 남긴다. 승인 대기 중인 건은 알림 섹션의 몫이다. */
const LOGGED_STATUSES = new Set<ShortageEvent['status']>([
  'dispatched',
  'in_transit',
  'completed',
  'rejected',
]);

/**
 * 액션 로그 — "관리자가 승인한 로봇 동작 기록".
 * 누가·언제·어느 라인에 무엇을 지시했는지를 최신순으로 남긴다.
 */
export function ActionLog({ shortageEvents, lines }: ActionLogProps) {
  const entries = shortageEvents
    .filter((event) => LOGGED_STATUSES.has(event.status))
    .sort((a, b) => (b.approvedAt ?? b.detectedAt).localeCompare(a.approvedAt ?? a.detectedAt))
    .slice(0, MAX_VISIBLE);

  return (
    <Card title="액션 로그" subtitle="관리자 승인 이후의 로봇 동작 기록" fill>
      {entries.length === 0 ? (
        <EmptyState message="기록된 액션이 없습니다." hint="승인이 이뤄지면 여기에 쌓입니다." />
      ) : (
        <ol className={styles.log}>
          {entries.map((event) => (
            <li key={event.id} className={styles.entry}>
              <time className={styles.time} dateTime={event.approvedAt ?? event.detectedAt}>
                {formatClock(event.approvedAt ?? event.detectedAt)}
              </time>

              <div className={styles.body}>
                <p className={styles.headline}>
                  {lines[event.lineId]?.name ?? event.lineId} · {event.partName} {event.requiredQty}개
                </p>
                <p className={styles.actor}>
                  {event.approvedBy ? `${event.approvedBy} 승인` : '자동 처리'}
                </p>
              </div>

              <Badge tone={toneForShortageStatus(event.status)}>{SHORTAGE_STATUS_LABEL[event.status]}</Badge>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
