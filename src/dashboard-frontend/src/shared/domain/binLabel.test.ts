import { describe, expect, it } from 'vitest';
import { describeShortageBin, formatBinLabel } from './binLabel';
import type { Bin, Line, ShortageEvent } from './types';

function makeBin(overrides: Partial<Bin>): Bin {
  return {
    id: 'line-a-bin-a',
    lineId: 'line-a',
    label: 'a',
    partId: 'P-101',
    partName: 'M6 볼트 세트',
    capacity: 50,
    threshold: 5,
    currentQty: 20,
    status: 'normal',
    updatedAt: '2026-08-31T00:00:00.000Z',
    ...overrides,
  };
}

function makeLine(bins: Bin[]): Line {
  return {
    id: 'line-a',
    name: 'A라인',
    threshold: 20,
    currentQty: 80,
    status: 'normal',
    updatedAt: '2026-08-31T00:00:00.000Z',
    position: { x: 0, y: 0 },
    bins,
  };
}

const EVENT: ShortageEvent = {
  id: 'evt-1',
  lineId: 'line-a',
  detectedAt: '2026-08-31T00:00:00.000Z',
  status: 'pending_approval',
  partName: '감지 당시 부품명',
  requiredQty: 10,
};

describe('formatBinLabel', () => {
  it("데이터의 'a'를 현장에서 부르는 'A칸'으로 바꾼다", () => {
    expect(formatBinLabel({ label: 'a' })).toBe('A칸');
  });
});

describe('describeShortageBin', () => {
  it('binId가 가리키는 칸의 표기와 현재 부품명을 돌려준다', () => {
    const line = makeLine([makeBin({}), makeBin({ id: 'line-a-bin-b', label: 'b', partName: '너트' })]);

    expect(describeShortageBin(line, { ...EVENT, binId: 'line-a-bin-b' })).toEqual({
      label: 'B칸',
      partName: '너트',
    });
  });

  it('binId가 없으면 null이다 — 칸 없는 라인의 문구가 바뀌면 안 된다', () => {
    expect(describeShortageBin(makeLine([]), EVENT)).toBeNull();
  });

  it('스냅샷에 그 칸이 없어도 null이다 — 내부 id를 화면에 흘리지 않는다', () => {
    expect(describeShortageBin(makeLine([makeBin({})]), { ...EVENT, binId: 'line-a-bin-z' })).toBeNull();
    expect(describeShortageBin(undefined, { ...EVENT, binId: 'line-a-bin-a' })).toBeNull();
  });
});
