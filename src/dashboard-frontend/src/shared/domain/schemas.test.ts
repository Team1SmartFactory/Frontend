import { describe, expect, it } from 'vitest';
import { RealtimeMessageSchema } from './schemas';

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
