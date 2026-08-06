import { describe, expect, it } from 'vitest';
import type { Camera, Line, RobotStatus, ShortageEvent } from '../../shared/domain/types';
import { selectExceptions } from './exceptions';

const NOW = new Date('2026-08-07T10:00:00Z').getTime();
const minutesAgo = (n: number) => new Date(NOW - n * 60_000).toISOString();

function line(over: Partial<Line> = {}): Line {
  return {
    id: 'line-1',
    name: '라인 A',
    threshold: 20,
    currentQty: 80,
    status: 'normal',
    updatedAt: minutesAgo(1),
    position: { x: 0, y: 0 },
    ...over,
  };
}

function camera(over: Partial<Camera> = {}): Camera {
  return { id: 'cam-1', scope: 'line', lineId: 'line-1', label: '라인 A 카메라', online: true, ...over };
}

function robot(over: Partial<RobotStatus> = {}): RobotStatus {
  return {
    robotId: 'beagle-1',
    type: 'beagle',
    state: 'idle',
    position: { x: 0, y: 0 },
    updatedAt: minutesAgo(1),
    ...over,
  };
}

function event(over: Partial<ShortageEvent> = {}): ShortageEvent {
  return {
    id: 'evt-1',
    lineId: 'line-1',
    detectedAt: minutesAgo(1),
    status: 'in_transit',
    partName: '볼트 M8',
    requiredQty: 12,
    ...over,
  };
}

function run(over: Partial<Parameters<typeof selectExceptions>[0]> = {}) {
  return selectExceptions(
    { cameras: [], robots: [], lines: [], shortageEvents: [], ...over },
    NOW,
  );
}

describe('selectExceptions', () => {
  it('정상 상태에서는 아무것도 잡지 않는다', () => {
    const result = run({ cameras: [camera()], robots: [robot()], lines: [line()] });
    expect(result).toEqual([]);
  });

  it('오프라인 카메라를 긴급으로 잡고, 어느 라인인지 이름으로 알려준다', () => {
    const result = run({ cameras: [camera({ online: false })], lines: [line()] });
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe('camera_offline');
    expect(result[0]?.tone).toBe('critical');
    expect(result[0]?.detail).toContain('라인 A');
  });

  it('라인에 속하지 않은 전체 뷰 카메라는 위치를 "공장 전체"로 적는다', () => {
    const result = run({ cameras: [camera({ scope: 'overview', lineId: undefined, online: false })] });
    expect(result[0]?.detail).toContain('공장 전체');
  });

  it('로봇 오류는 긴급, 오프라인은 그보다 낮게 잡는다', () => {
    const result = run({ robots: [robot({ robotId: 'r-off', state: 'offline' }), robot({ robotId: 'r-err', state: 'error' })] });
    // 급한 것이 위로 — 넣은 순서와 무관하게 오류가 먼저 온다.
    expect(result.map((item) => item.headline)).toEqual(['r-err 오류', 'r-off 오프라인']);
    expect(result[0]?.tone).toBe('critical');
    expect(result[1]?.tone).toBe('serious');
  });

  it('보충이 10분을 넘겨 끝나지 않으면 지연으로 잡는다', () => {
    const stalled = run({ lines: [line()], shortageEvents: [event({ approvedAt: minutesAgo(11) })] });
    expect(stalled).toHaveLength(1);
    expect(stalled[0]?.kind).toBe('transit_stalled');
    expect(stalled[0]?.detail).toContain('11분째');

    const fresh = run({ lines: [line()], shortageEvents: [event({ approvedAt: minutesAgo(9) })] });
    expect(fresh).toEqual([]);
  });

  it('완료·반려된 건은 지연으로 보지 않는다', () => {
    const result = run({
      lines: [line()],
      shortageEvents: [
        event({ id: 'a', status: 'completed', approvedAt: minutesAgo(600) }),
        event({ id: 'b', status: 'rejected', approvedAt: minutesAgo(600) }),
      ],
    });
    expect(result).toEqual([]);
  });

  it('임계치에 가까워진 라인만 잡고, 이미 부족한 라인은 잡지 않는다', () => {
    // threshold 20 기준: 25는 1.5배(30) 안쪽이라 근접, 15는 이미 부족.
    const result = run({ lines: [line({ id: 'near', currentQty: 25 }), line({ id: 'short', currentQty: 15 })] });
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe('line_near_threshold');
    expect(result[0]?.id).toContain('near');
  });

  it('승인 대기 건은 모달의 몫이므로 잡지 않는다', () => {
    const result = run({
      lines: [line()],
      shortageEvents: [event({ status: 'pending_approval', detectedAt: minutesAgo(600) })],
    });
    expect(result).toEqual([]);
  });

  it('여러 종류가 섞이면 급한 것부터 정렬한다', () => {
    const result = run({
      cameras: [camera({ online: false })],
      robots: [robot({ state: 'offline' })],
      lines: [line({ currentQty: 25 })],
    });
    expect(result.map((item) => item.tone)).toEqual(['critical', 'serious', 'warning']);
  });
});
