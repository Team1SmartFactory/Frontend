import { describe, expect, it } from 'vitest';
import { selectActiveShortageLineIds, selectPendingApprovals, sortLinesByPriority } from './selectors';
import type { Line, ShortageEvent } from '../shared/domain/types';

function makeLine(overrides: Partial<Line>): Line {
  return {
    id: 'line-x',
    name: '테스트 라인',
    threshold: 20,
    currentQty: 80,
    status: 'normal',
    updatedAt: '2026-08-03T00:00:00.000Z',
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

function makeShortageEvent(overrides: Partial<ShortageEvent>): ShortageEvent {
  return {
    id: 'evt-x',
    lineId: 'line-x',
    detectedAt: '2026-08-03T00:00:00.000Z',
    status: 'pending_approval',
    partName: '부품',
    requiredQty: 10,
    ...overrides,
  };
}

describe('sortLinesByPriority', () => {
  it('보충 중인 라인을 최상단에 배치한다', () => {
    const lines = [
      makeLine({ id: 'a', name: 'A', status: 'normal' }),
      makeLine({ id: 'b', name: 'B', status: 'restocking' }),
      makeLine({ id: 'c', name: 'C', status: 'normal' }),
    ];

    const sorted = sortLinesByPriority(lines);

    expect(sorted[0]?.id).toBe('b');
  });

  it('상태가 같으면 이름순으로 정렬한다', () => {
    const lines = [makeLine({ id: 'b', name: 'B' }), makeLine({ id: 'a', name: 'A' })];

    const sorted = sortLinesByPriority(lines);

    expect(sorted.map((line) => line.id)).toEqual(['a', 'b']);
  });
});

describe('selectPendingApprovals', () => {
  it('승인 대기 상태인 이벤트만 오래된 순으로 반환한다', () => {
    const events: Record<string, ShortageEvent> = {
      e1: makeShortageEvent({ id: 'e1', detectedAt: '2026-08-03T00:01:00.000Z' }),
      e2: makeShortageEvent({ id: 'e2', detectedAt: '2026-08-03T00:00:00.000Z' }),
      e3: makeShortageEvent({ id: 'e3', detectedAt: '2026-08-03T00:02:00.000Z', status: 'completed' }),
    };

    const pending = selectPendingApprovals(events);

    expect(pending.map((event) => event.id)).toEqual(['e2', 'e1']);
  });
});

describe('selectActiveShortageLineIds', () => {
  it('진행 중(대기/지시/운반) 상태의 라인만 포함한다', () => {
    const events: Record<string, ShortageEvent> = {
      e1: makeShortageEvent({ id: 'e1', lineId: 'line-a', status: 'pending_approval' }),
      e2: makeShortageEvent({ id: 'e2', lineId: 'line-b', status: 'completed' }),
      e3: makeShortageEvent({ id: 'e3', lineId: 'line-c', status: 'in_transit' }),
    };

    const ids = selectActiveShortageLineIds(events);

    expect(ids.has('line-a')).toBe(true);
    expect(ids.has('line-b')).toBe(false);
    expect(ids.has('line-c')).toBe(true);
  });
});
