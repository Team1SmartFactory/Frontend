import type { ShortageEvent } from '../../shared/domain/types';
import styles from './EventTimeline.module.css';

interface EventTimelineProps {
  shortageEvents: ShortageEvent[];
}

const STATUS_LABEL: Record<ShortageEvent['status'], string> = {
  pending_approval: '승인 대기',
  dispatched: '보충 지시',
  in_transit: '운반 중',
  completed: '완료',
  rejected: '반려',
};

const MAX_VISIBLE_EVENTS = 12;

/** "실시간 이벤트 타임라인" — 5단계 프레임워크의 각 이벤트가 최신순으로 쌓인다. */
export function EventTimeline({ shortageEvents }: EventTimelineProps) {
  const sorted = [...shortageEvents]
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
    .slice(0, MAX_VISIBLE_EVENTS);

  return (
    <div className={styles.timeline} aria-label="이벤트 타임라인">
      <h3>이벤트 타임라인</h3>
      {sorted.length === 0 && <p className={styles.empty}>아직 기록된 이벤트가 없습니다.</p>}
      <ol>
        {sorted.map((event) => (
          <li key={event.id}>
            <time dateTime={event.detectedAt}>{new Date(event.detectedAt).toLocaleTimeString('ko-KR')}</time>
            <span>{event.lineId}</span>
            <span>{event.partName}</span>
            <span data-status={event.status}>{STATUS_LABEL[event.status]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
