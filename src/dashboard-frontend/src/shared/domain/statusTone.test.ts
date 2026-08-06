import { describe, expect, it } from 'vitest';
import {
  detectedVerdict,
  isTreatedAsShortage,
  oppositeVerdict,
  toneForLine,
  toneForRobotState,
  toneForShortageStatus,
} from './statusTone';
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

describe('isTreatedAsShortage', () => {
  it('임계치 이하면 부족으로 취급한다', () => {
    expect(isTreatedAsShortage(makeLine({ currentQty: 20 }))).toBe(true);
    expect(isTreatedAsShortage(makeLine({ currentQty: 21 }))).toBe(false);
  });

  it('보충 중이면 재고량이 회복돼도 아직 부족 처리 중으로 본다', () => {
    // 색은 accent(파랑)지만 "부족해서 로봇이 가는 중"이므로,
    // 관리자가 지금 누를 수 있는 버튼은 정상 되돌리기(=작업 취소)여야 한다.
    expect(isTreatedAsShortage(makeLine({ currentQty: 90, status: 'restocking' }))).toBe(true);
  });
});

describe('oppositeVerdict / detectedVerdict', () => {
  it('부족 취급 중이면 관리자 판정은 정상 쪽으로 넘어간다', () => {
    const line = makeLine({ currentQty: 10 });
    expect(detectedVerdict(line)).toBe('shortage');
    expect(oppositeVerdict(line)).toBe('sufficient');
  });

  it('정상이면 관리자 판정은 부족 쪽으로 넘어간다', () => {
    const line = makeLine({ currentQty: 80 });
    expect(detectedVerdict(line)).toBe('sufficient');
    expect(oppositeVerdict(line)).toBe('shortage');
  });

  it('두 판정은 항상 서로 반대다', () => {
    for (const qty of [0, 20, 21, 50, 100]) {
      const line = makeLine({ currentQty: qty });
      expect(detectedVerdict(line)).not.toBe(oppositeVerdict(line));
    }
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
