import { describe, expect, it } from 'vitest';
import {
  selectActiveShortageBinIds,
  selectActiveShortageLineIds,
  selectBlockedRobots,
  selectPendingApprovals,
  selectPendingShortageBinIds,
  selectPendingShortageLineIds,
  selectRejectedEvents,
  selectRestockingBinIds,
  selectRestockingLineIds,
  sortLinesByPriority,
} from './selectors';
import type { Line, RobotStatus, ShortageEvent } from '../shared/domain/types';

function makeLine(overrides: Partial<Line>): Line {
  return {
    id: 'line-x',
    name: '테스트 라인',
    threshold: 20,
    currentQty: 80,
    status: 'normal',
    updatedAt: '2026-08-03T00:00:00.000Z',
    position: { x: 0, y: 0 },
    bins: [],
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

function makeRobot(overrides: Partial<RobotStatus>): RobotStatus {
  return {
    robotId: 'omxf-line-a',
    type: 'omxf_line',
    state: 'idle',
    position: { x: 0, y: 0 },
    updatedAt: '2026-08-03T00:00:00.000Z',
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

  it('임계치 이하 라인을 보충 중인 라인보다 앞에 둔다', () => {
    // 아직 아무도 손대지 않은 라인이, 이미 조치가 진행 중인 라인보다 급하다.
    const lines = [
      makeLine({ id: 'restocking', name: 'A', status: 'restocking' }),
      makeLine({ id: 'shortage', name: 'B', currentQty: 8 }),
    ];

    const sorted = sortLinesByPriority(lines);

    expect(sorted.map((line) => line.id)).toEqual(['shortage', 'restocking']);
  });

  it('재고가 적을수록 앞에 온다', () => {
    const lines = [
      makeLine({ id: 'plenty', name: 'A', currentQty: 90 }),
      makeLine({ id: 'low', name: 'B', currentQty: 30 }),
      makeLine({ id: 'empty', name: 'C', currentQty: 10 }),
    ];

    const sorted = sortLinesByPriority(lines);

    expect(sorted.map((line) => line.id)).toEqual(['empty', 'low', 'plenty']);
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

describe('selectBlockedRobots', () => {
  it('정지한 로봇만 오래 멈춘 순으로 반환한다', () => {
    const robots: Record<string, RobotStatus> = {
      a: makeRobot({ robotId: 'omxf-line-a', state: 'blocked', updatedAt: '2026-08-03T00:01:00.000Z' }),
      b: makeRobot({ robotId: 'omxf-line-b', state: 'blocked', updatedAt: '2026-08-03T00:00:00.000Z' }),
      c: makeRobot({ robotId: 'beagle-1', type: 'beagle', state: 'moving' }),
    };

    const blocked = selectBlockedRobots(robots);

    expect(blocked.map((robot) => robot.robotId)).toEqual(['omxf-line-b', 'omxf-line-a']);
  });

  it('오류(error)나 오프라인은 포함하지 않는다', () => {
    // 사람이 복구 버튼으로 되살릴 수 있는 상태는 blocked뿐이다.
    const robots: Record<string, RobotStatus> = {
      a: makeRobot({ robotId: 'omxf-line-a', state: 'error' }),
      b: makeRobot({ robotId: 'omxf-line-b', state: 'offline' }),
      c: makeRobot({ robotId: 'omxf-line-c', state: 'idle' }),
    };

    expect(selectBlockedRobots(robots)).toEqual([]);
  });

  it('같은 시각에 멈춘 로봇은 id순으로 갈라 순서가 흔들리지 않게 한다', () => {
    const robots: Record<string, RobotStatus> = {
      b: makeRobot({ robotId: 'omxf-line-b', state: 'blocked' }),
      a: makeRobot({ robotId: 'omxf-line-a', state: 'blocked' }),
    };

    expect(selectBlockedRobots(robots).map((robot) => robot.robotId)).toEqual([
      'omxf-line-a',
      'omxf-line-b',
    ]);
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

describe('selectActiveShortageBinIds', () => {
  it('진행 중인 건의 칸만 모으고, 칸이 없는 이벤트는 무시한다', () => {
    const events: Record<string, ShortageEvent> = {
      e1: makeShortageEvent({ id: 'e1', binId: 'line-a-bin-a', status: 'pending_approval' }),
      e2: makeShortageEvent({ id: 'e2', binId: 'line-a-bin-b', status: 'in_transit' }),
      e3: makeShortageEvent({ id: 'e3', binId: 'line-a-bin-c', status: 'completed' }),
      e4: makeShortageEvent({ id: 'e4', status: 'pending_approval' }),
    };

    const ids = selectActiveShortageBinIds(events);

    expect([...ids].sort()).toEqual(['line-a-bin-a', 'line-a-bin-b']);
  });
});

describe('selectRejectedEvents (이슈 #46)', () => {
  it('반려된 건만 오래된 순으로 돌려준다', () => {
    const events: Record<string, ShortageEvent> = {
      newer: makeShortageEvent({ id: 'newer', status: 'rejected', detectedAt: '2026-09-01T02:00:00.000Z' }),
      older: makeShortageEvent({ id: 'older', status: 'rejected', detectedAt: '2026-09-01T01:00:00.000Z' }),
      open: makeShortageEvent({ id: 'open', status: 'pending_approval' }),
      done: makeShortageEvent({ id: 'done', status: 'completed' }),
    };

    expect(selectRejectedEvents(events).map((event) => event.id)).toEqual(['older', 'newer']);
  });
});

describe('승인 대기/보충 중 분리 (이슈 #38)', () => {
  // 승인을 누르면 화면은 '부족'(빨강)이 아니라 '보충 중'(파랑)이어야 한다 —
  // 계속 빨가면 관리자는 승인이 안 먹었다고 판단해 같은 건을 다시 조치한다.
  const events: Record<string, ShortageEvent> = {
    pending: makeShortageEvent({
      id: 'pending',
      lineId: 'line-a',
      binId: 'line-a-bin-a',
      status: 'pending_approval',
    }),
    dispatched: makeShortageEvent({
      id: 'dispatched',
      lineId: 'line-a',
      binId: 'line-a-bin-b',
      status: 'dispatched',
    }),
    transit: makeShortageEvent({
      id: 'transit',
      lineId: 'line-b',
      binId: 'line-b-bin-a',
      status: 'in_transit',
    }),
    done: makeShortageEvent({
      id: 'done',
      lineId: 'line-c',
      binId: 'line-c-bin-a',
      status: 'completed',
    }),
  };

  it('pending은 승인 대기 건만 모은다', () => {
    expect([...selectPendingShortageBinIds(events)]).toEqual(['line-a-bin-a']);
    expect([...selectPendingShortageLineIds(events)]).toEqual(['line-a']);
  });

  it('restocking은 지시됨/운반 중만 모으고, 완료된 건은 강제색을 푼다', () => {
    expect([...selectRestockingBinIds(events)].sort()).toEqual([
      'line-a-bin-b',
      'line-b-bin-a',
    ]);
    expect([...selectRestockingLineIds(events)].sort()).toEqual(['line-a', 'line-b']);
    expect(selectRestockingBinIds(events).has('line-c-bin-a')).toBe(false);
  });

  it('같은 라인에 두 상태가 겹치면 라인은 양쪽 집합에 다 들어간다 (LED는 pending 우선)', () => {
    expect(selectPendingShortageLineIds(events).has('line-a')).toBe(true);
    expect(selectRestockingLineIds(events).has('line-a')).toBe(true);
  });
});
