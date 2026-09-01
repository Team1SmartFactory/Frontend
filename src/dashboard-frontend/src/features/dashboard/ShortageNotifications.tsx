import type { Line, ShortageEvent } from '../../shared/domain/types';
import { describeShortageBin } from '../../shared/domain/binLabel';
import { Badge, Button, Card, EmptyState, StatusLed } from '../../shared/ui';
import { formatElapsed } from '../../shared/utils/formatTime';
import { useRejectedShortageActions } from './useRejectedShortageActions';
import styles from './ShortageNotifications.module.css';

interface ShortageNotificationsProps {
  pendingEvents: ShortageEvent[];
  rejectedEvents: ShortageEvent[];
  lines: Record<string, Line>;
}

/** 칸 단위 라인(line-a)은 어느 칸인지까지 말해야 사람이 바로 그 칸으로 간다. */
function headlineFor(event: ShortageEvent, lines: Record<string, Line>) {
  const line = lines[event.lineId];
  const bin = describeShortageBin(line, event);
  const lineName = line?.name ?? event.lineId;
  return {
    place: bin ? `${lineName} ${bin.label}` : lineName,
    partName: bin?.partName ?? event.partName,
  };
}

/**
 * 노티피케이션 섹션 — "부족 발생 → 알람 → 승인 → 로봇 동작" 흐름의 알람 단계.
 * 승인 조작 자체는 모든 뷰 위에 뜨는 ShortageApprovalModal이 담당하므로,
 * 승인 대기 건은 "무엇이 얼마나 밀려 있는지"만 보여준다.
 *
 * 반려된 건은 여기서가 마지막 확인 자리다 (이슈 #46): 정말 반려가 맞으면
 * [삭제], 뒤늦게 부족이 맞다고 판단하면 [물품 보충]으로 그 자리에서 되살린다 —
 * 반려가 걸어둔 쿨다운 동안은 카메라 재감지도 눌려 있어 달리 되살릴 길이 없다.
 */
export function ShortageNotifications({
  pendingEvents,
  rejectedEvents,
  lines,
}: ShortageNotificationsProps) {
  const { restock, remove, busyId, notReadyFor } = useRejectedShortageActions();
  const isEmpty = pendingEvents.length === 0 && rejectedEvents.length === 0;

  return (
    <Card
      title="알림"
      subtitle="관리자 승인을 기다리는 부족 건과 반려 확인이 필요한 건"
      action={
        <>
          {pendingEvents.length > 0 && (
            <Badge tone="critical" led pulse>
              승인 대기 {pendingEvents.length}건
            </Badge>
          )}
          {rejectedEvents.length > 0 && (
            <Badge tone="warning" led>
              반려 확인 {rejectedEvents.length}건
            </Badge>
          )}
          {isEmpty && (
            <Badge tone="good" led>
              대기 없음
            </Badge>
          )}
        </>
      }
    >
      {isEmpty ? (
        <EmptyState message="처리할 알림이 없습니다." hint="모든 라인이 임계치 위에서 운영 중입니다." />
      ) : (
        <ul className={styles.list} role="alert">
          {pendingEvents.map((event) => {
            const { place, partName } = headlineFor(event, lines);

            return (
              <li key={event.id} className={styles.item} data-tone="critical">
                <StatusLed tone="critical" pulse />
                <div className={styles.body}>
                  <p className={styles.headline}>
                    <strong>{place}</strong> 부품 부족
                  </p>
                  <p className={styles.detail}>
                    {partName} · {event.requiredQty}개 보충 필요
                  </p>
                </div>
                <time className={styles.time} dateTime={event.detectedAt}>
                  {formatElapsed(event.detectedAt)}
                </time>
              </li>
            );
          })}

          {rejectedEvents.map((event) => {
            const { place, partName } = headlineFor(event, lines);
            const notReady = notReadyFor(event.id);
            const busy = busyId === event.id;

            return (
              <li key={event.id} className={styles.item} data-tone="warning">
                <StatusLed tone="warning" />
                <div className={styles.body}>
                  <p className={styles.headline}>
                    <strong>{place}</strong> 부족 알림 반려됨 — 최종 확인 필요
                  </p>
                  <p className={styles.detail}>
                    {partName} · 정말 반려가 맞으면 삭제, 부족이 맞았다면 물품 보충
                  </p>
                  {notReady && (
                    <p className={styles.notReady} role="alert">
                      {notReady.message}
                      {notReady.reasons.length > 0 && ` — ${notReady.reasons.join(', ')}`}
                    </p>
                  )}
                </div>
                <div className={styles.actions}>
                  <Button size="sm" variant="primary" disabled={busy} onClick={() => void restock(event)}>
                    물품 보충
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove(event)}>
                    삭제
                  </Button>
                </div>
                <time className={styles.time} dateTime={event.detectedAt}>
                  {formatElapsed(event.detectedAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
