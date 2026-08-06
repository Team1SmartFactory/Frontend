import { describe, expect, it } from 'vitest';
import { toneForLine } from '../domain/statusTone';
import type { Line, ShortageEvent } from '../domain/types';
import { mockFactoryBackend } from './mockFactoryBackend';

/**
 * 관리자 판정이 라인 상태와 로봇 작업으로 이어지는 경로를 고정한다.
 *
 * 시뮬레이터는 싱글턴이라 상태가 테스트 사이에 남는다. start()를 부르지 않으면
 * 틱이 돌지 않으므로 감소·작업 진행이 끼어들지 않고, 테스트마다 다른 라인을 써
 * 서로를 밟지 않게 한다.
 */
function lineOf(id: string): Line {
  const line = mockFactoryBackend.getSnapshot().lines.find((item) => item.id === id);
  if (!line) throw new Error(`테스트 대상 라인이 없습니다: ${id}`);
  return line;
}

function eventsOf(lineId: string): ShortageEvent[] {
  return mockFactoryBackend.getSnapshot().shortageEvents.filter((event) => event.lineId === lineId);
}

describe('overrideLineStock', () => {
  it('부족으로 지정하면 승인 대기를 거치지 않고 보충 작업이 나간다', async () => {
    await mockFactoryBackend.overrideLineStock('line-a', 'shortage', '관리자');

    const events = eventsOf('line-a');
    expect(events).toHaveLength(1);
    // 지시한 사람이 곧 승인권자이므로 pending_approval을 건너뛴다.
    expect(events[0]?.status).toBe('dispatched');
    expect(events[0]?.approvedBy).toBe('관리자');
    expect(lineOf('line-a').status).toBe('restocking');
  });

  it('정상으로 되돌리면 진행 중인 건을 닫고 라인이 정상 색으로 돌아간다', async () => {
    // 위 테스트가 만들어 둔 진행 중 건을 이어서 취소한다.
    await mockFactoryBackend.overrideLineStock('line-a', 'sufficient', '관리자');

    expect(eventsOf('line-a').every((event) => event.status === 'rejected')).toBe(true);

    const line = lineOf('line-a');
    expect(line.status).toBe('normal');
    // 측정값을 보정하므로 '관찰'이 아니라 '정상' 구간까지 올라와야 한다.
    expect(toneForLine(line)).toBe('good');
  });

  it('이미 처리 중인 라인에 다시 지시해도 작업을 두 번 만들지 않는다', async () => {
    await mockFactoryBackend.overrideLineStock('line-c', 'shortage', '관리자');
    await mockFactoryBackend.overrideLineStock('line-c', 'shortage', '관리자');

    expect(eventsOf('line-c')).toHaveLength(1);
  });
});

describe('rejectShortage', () => {
  it('반려하면 부족이었던 라인이 정상으로 바뀐다', async () => {
    await mockFactoryBackend.overrideLineStock('line-b', 'shortage', '관리자');
    const pending = eventsOf('line-b')[0];
    expect(pending).toBeDefined();

    await mockFactoryBackend.rejectShortage(pending!.id);

    const line = lineOf('line-b');
    expect(line.status).toBe('normal');
    expect(toneForLine(line)).toBe('good');
  });
});
