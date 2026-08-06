import { Badge, Card, EmptyState, StatusLed } from '../../shared/ui';
import { formatElapsed } from '../../shared/utils/formatTime';
import type { DashboardException } from './exceptions';
import styles from './ExceptionFeed.module.css';

interface ExceptionFeedProps {
  exceptions: DashboardException[];
}

/**
 * 알림 섹션 — 지금 화면 어디에도 드러나지 않는 이상 신호를 모아 보여준다.
 *
 * 이 자리는 원래 승인 대기 목록이었는데, 승인 대기가 생기는 순간이 곧
 * ShortageApprovalModal이 화면을 덮는 순간이라 사람이 볼 수 없는 섹션이었다.
 * 그래서 모달이 맡지 못하는 것 — 카메라·로봇 고장, 멈춘 운반, 임계치 근접 —
 * 으로 역할을 옮겼다. 어떤 신호를 잡는지는 exceptions.ts가 정한다.
 *
 * 조작 버튼은 두지 않는다. 여기서 할 일은 "어디를 봐야 하는지"를 알리는 것까지고,
 * 실제 조치는 각 탭(평면도·CCTV)에서 이뤄진다.
 */
export function ExceptionFeed({ exceptions }: ExceptionFeedProps) {
  const critical = exceptions.filter((item) => item.tone === 'critical').length;

  return (
    <Card
      title="알림"
      subtitle="조치가 필요한 이상 신호"
      action={
        exceptions.length > 0 ? (
          <Badge tone={critical > 0 ? 'critical' : 'warning'} led pulse={critical > 0}>
            {critical > 0 ? `긴급 ${critical}건 · ` : ''}
            {exceptions.length}건
          </Badge>
        ) : (
          <Badge tone="good" led>
            이상 없음
          </Badge>
        )
      }
    >
      {exceptions.length === 0 ? (
        <EmptyState
          message="확인이 필요한 이상 신호가 없습니다."
          hint="카메라·로봇이 모두 정상이고, 지연된 보충 작업도 없습니다."
        />
      ) : (
        <ul className={styles.list}>
          {exceptions.map((item) => (
            <li key={item.id} className={styles.item} data-tone={item.tone}>
              <StatusLed tone={item.tone} pulse={item.tone === 'critical'} />
              <div className={styles.body}>
                <p className={styles.headline}>{item.headline}</p>
                <p className={styles.detail}>{item.detail}</p>
              </div>
              {item.since && (
                <time className={styles.time} dateTime={item.since}>
                  {formatElapsed(item.since)}
                </time>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
