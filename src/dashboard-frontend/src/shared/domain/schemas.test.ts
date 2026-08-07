import { describe, expect, it } from 'vitest';
import { RealtimeMessageSchema, RobotStatusSchema, ShortageEventSchema } from './schemas';

describe('nullable optional 필드 (백엔드 FastAPI/Pydantic이 명시적 null을 보내는 경우)', () => {
  it('RobotStatus.currentTaskId가 null이어도 undefined로 정규화해 통과시킨다', () => {
    const result = RobotStatusSchema.safeParse({
      robotId: 'beagle-1',
      type: 'beagle',
      state: 'idle',
      currentTaskId: null,
      position: { x: 0, y: 0 },
      updatedAt: '2026-08-03T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currentTaskId).toBeUndefined();
  });

  it('ShortageEvent.approvedBy/approvedAt이 null이어도 통과시킨다', () => {
    const result = ShortageEventSchema.safeParse({
      id: 'evt-1',
      lineId: 'L1',
      detectedAt: '2026-08-03T00:00:00.000Z',
      status: 'pending_approval',
      partName: 'M6 볼트 세트',
      requiredQty: 47,
      approvedBy: null,
      approvedAt: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.approvedBy).toBeUndefined();
      expect(result.data.approvedAt).toBeUndefined();
    }
  });
});

describe('RealtimeMessageSchema', () => {
  it('유효한 line.inventory 메시지를 허용한다', () => {
    const result = RealtimeMessageSchema.safeParse({
      type: 'line.inventory',
      payload: {
        lineId: 'line-a',
        currentQty: 42,
        status: 'normal',
        updatedAt: '2026-08-03T00:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('알 수 없는 status 값을 가진 메시지는 거부한다', () => {
    const result = RealtimeMessageSchema.safeParse({
      type: 'line.inventory',
      payload: {
        lineId: 'line-a',
        currentQty: 42,
        status: 'unknown',
        updatedAt: '2026-08-03T00:00:00.000Z',
      },
    });

    expect(result.success).toBe(false);
  });

  it('필드가 누락된 robot.status 메시지는 거부한다', () => {
    const result = RealtimeMessageSchema.safeParse({
      type: 'robot.status',
      payload: { robotId: 'beagle-1', type: 'beagle' },
    });

    expect(result.success).toBe(false);
  });

  it('정의되지 않은 메시지 타입은 거부한다', () => {
    const result = RealtimeMessageSchema.safeParse({ type: 'line.unknown', payload: {} });

    expect(result.success).toBe(false);
  });
});
