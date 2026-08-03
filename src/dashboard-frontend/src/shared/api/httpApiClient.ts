import type { z } from 'zod';
import { ShortageEventSchema, SnapshotSchema } from '../domain/schemas';
import type { ApiClient, Snapshot } from './ApiClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * fetch 응답을 zod 스키마로 검증한다.
 * 백엔드가 계약과 다른 형태를 보내더라도 앱이 즉시 죽는 대신
 * 명확한 에러로 실패하고 호출부(useShortageActions 등)가 처리하게 한다.
 */
async function requestJson<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${path} (HTTP ${response.status})`);
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`API 응답 형식 오류: ${path}`);
  }

  return parsed.data;
}

export const httpApiClient: ApiClient = {
  fetchSnapshot: (): Promise<Snapshot> => requestJson('/snapshot', SnapshotSchema),

  approveShortage: (id, approvedBy) =>
    requestJson(`/shortage-events/${id}/approve`, ShortageEventSchema, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    }),

  rejectShortage: (id) =>
    requestJson(`/shortage-events/${id}/reject`, ShortageEventSchema, {
      method: 'POST',
    }),
};
