import type { Line, ShortageEvent } from '../../shared/domain/types';
import { Badge, Card, EmptyState, StatusLed } from '../../shared/ui';
import { formatElapsed } from '../../shared/utils/formatTime';
import styles from './ShortageNotifications.module.css';

interface ShortageNotificationsProps {
  pendingEvents: ShortageEvent[];
  lines: Record<string, Line>;
}

/**
 * 노티피케이션 섹션 — "부족 발생 → 알람 → 승인 → 로봇 동작" 흐름의 알람 단계.
 * 승인 조작 자체는 모든 뷰 위에 뜨는 ShortageApprovalModal이 담당하므로,
 * 여기서는 "무엇이 얼마나 밀려 있는지"만 보여준다.
 */
export function ShortageNotifications({ pendingEvents, lines }: ShortageNotificationsProps) {
  return (
    <Card
      title="알림"
      subtitle="관리자 승인을 기다리는 부품 부족 건"
      action={
        pendingEvents.length > 0 ? (
          <Badge tone="critical" led pulse>
            승인 대기 {pendingEvents.length}건
          </Badge>
        ) : (
          <Badge tone="good" led>
            대기 없음
          </Badge>
        )
      }
    >
      {pendingEvents.length === 0 ? (
        <EmptyState message="승인 대기 중인 알림이 없습니다." hint="모든 라인이 임계치 위에서 운영 중입니다." />
      ) : (
        <ul className={styles.list} role="alert">
          {pendingEvents.map((event) => (
            <li key={event.id} className={styles.item} data-tone="critical">
              <StatusLed tone="critical" pulse />
              <div className={styles.body}>
                <p className={styles.headline}>
                  <strong>{lines[event.lineId]?.name ?? event.lineId}</strong> 부품 부족
                </p>
                <p className={styles.detail}>
                  {event.partName} · {event.requiredQty}개 보충 필요
                </p>
              </div>
              <time className={styles.time} dateTime={event.detectedAt}>
                {formatElapsed(event.detectedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
