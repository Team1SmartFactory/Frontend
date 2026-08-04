import type { z } from 'zod';
import { ApiError, extractFastApiDetail } from './ApiError';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const DEFAULT_TIMEOUT_MS = 10_000;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON 직렬화해서 보낼 본문. undefined면 본문 없이 보낸다. */
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * 두 개의 AbortSignal을 합친다.
 * 타임아웃과 호출부(React Query의 취소) 중 먼저 오는 쪽이 요청을 끊게 한다.
 *
 * AbortSignal.any()는 최신 브라우저 전용이라 직접 구현했다.
 */
function linkSignals(timeoutMs: number, external?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

  const forwardAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) forwardAbort();
    else external.addEventListener('abort', forwardAbort);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', forwardAbort);
    },
  };
}

/**
 * 모든 REST 호출이 지나는 단일 통로.
 *
 * 여기서 세 가지를 한 번에 처리한다.
 *   1. 전송   — base URL 결합, JSON 헤더, 타임아웃, 취소
 *   2. 실패   — 네트워크/4xx/5xx 를 ApiError 한 타입으로 정규화
 *   3. 검증   — 200 응답도 zod로 통과시킨 뒤에만 호출부에 넘긴다
 *
 * 3번이 핵심이다. 백엔드가 계약과 다른 형태를 보내면 화면 깊은 곳에서
 * undefined 참조로 터지는 대신, 요청 지점에서 명확한 오류로 실패한다.
 */
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const { signal, cleanup } = linkSignals(timeoutMs, externalSignal);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // 호출부가 의도적으로 취소한 경우는 오류로 승격하지 않는다.
    // (React Query가 언마운트/키 변경 시 취소하는 정상 경로)
    if (externalSignal?.aborted) throw error;

    throw new ApiError({
      kind: 'network',
      message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
      path,
      detail: error,
    });
  } finally {
    cleanup();
  }

  if (!response.ok) {
    // 본문이 비었거나 JSON이 아닐 수 있으므로 실패를 감싼다.
    const payload: unknown = await response.json().catch(() => null);
    const detail = extractFastApiDetail(payload);

    throw new ApiError({
      kind: response.status >= 500 ? 'server' : 'client',
      message: detail ?? `요청을 처리하지 못했습니다. (HTTP ${response.status})`,
      path,
      status: response.status,
      detail: payload,
    });
  }

  // 204 No Content 처럼 본문이 없는 성공 응답도 스키마로 검증한다.
  // (z.void() / z.null() 을 넘기면 통과)
  const raw: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError({
      kind: 'contract',
      message: '서버 응답 형식이 예상과 다릅니다. 백엔드 버전을 확인해 주세요.',
      path,
      status: response.status,
      detail: parsed.error.flatten(),
    });
  }

  return parsed.data;
}
