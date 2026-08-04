import { describe, expect, it } from 'vitest';
import { toneForLine, toneForRobotState, toneForShortageStatus } from './statusTone';
import type { Line } from './types';

function makeLine(overrides: Partial<Line> = {}): Line {
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

describe('toneForLine', () => {
  it('임계치 이하면 critical', () => {
    expect(toneForLine(makeLine({ currentQty: 20 }))).toBe('critical');
    expect(toneForLine(makeLine({ currentQty: 5 }))).toBe('critical');
  });

  it('임계치의 1.5배 이하면 serious', () => {
    expect(toneForLine(makeLine({ currentQty: 30 }))).toBe('serious');
  });

  it('임계치의 2.5배 이하면 warning', () => {
    expect(toneForLine(makeLine({ currentQty: 50 }))).toBe('warning');
  });

  it('여유가 충분하면 good', () => {
    expect(toneForLine(makeLine({ currentQty: 80 }))).toBe('good');
  });

  it('보충 중이면 재고량과 무관하게 accent', () => {
    expect(toneForLine(makeLine({ currentQty: 3, status: 'restocking' }))).toBe('accent');
  });
});

describe('toneForRobotState', () => {
  it('오류는 critical, 동작 중은 accent, 대기는 idle', () => {
    expect(toneForRobotState('error')).toBe('critical');
    expect(toneForRobotState('moving')).toBe('accent');
    expect(toneForRobotState('working')).toBe('accent');
    expect(toneForRobotState('idle')).toBe('idle');
    expect(toneForRobotState('offline')).toBe('idle');
  });
});

describe('toneForShortageStatus', () => {
  it('승인 대기는 critical, 완료는 good', () => {
    expect(toneForShortageStatus('pending_approval')).toBe('critical');
    expect(toneForShortageStatus('completed')).toBe('good');
    expect(toneForShortageStatus('rejected')).toBe('idle');
  });
});
