import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError } from './ApiError';
import { request } from './httpClient';

const Schema = z.object({ id: z.string(), qty: z.number() });

function mockFetch(init: { status: number; body: unknown }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: init.status >= 200 && init.status < 300,
      status: init.status,
      json: () => Promise.resolve(init.body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('계약에 맞는 응답은 파싱해서 돌려준다', async () => {
    mockFetch({ status: 200, body: { id: 'line-a', qty: 42 } });

    await expect(request('/x', Schema)).resolves.toEqual({ id: 'line-a', qty: 42 });
  });

  it('200이어도 형태가 계약과 다르면 contract 오류로 실패한다', async () => {
    // 백엔드가 qty를 문자열로 보내는 상황. 화면 깊은 곳에서 터지는 대신
    // 요청 지점에서 걸러야 원인을 찾을 수 있다.
    mockFetch({ status: 200, body: { id: 'line-a', qty: '42' } });

    await expect(request('/x', Schema)).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'contract',
    });
  });

  it('4xx는 client 오류로 분류하고 FastAPI detail을 메시지로 쓴다', async () => {
    mockFetch({ status: 404, body: { detail: '부족 이벤트를 찾을 수 없습니다' } });

    const error = await request('/x', Schema).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'client',
      status: 404,
      message: '부족 이벤트를 찾을 수 없습니다',
    });
    expect((error as ApiError).retryable).toBe(false);
  });

  it('5xx는 server 오류로 분류하고 재시도 가능으로 표시한다', async () => {
    mockFetch({ status: 503, body: null });

    const error = (await request('/x', Schema).catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe('server');
    expect(error.retryable).toBe(true);
  });

  it('fetch 자체가 실패하면 network 오류로 감싼다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = (await request('/x', Schema).catch((e: unknown) => e)) as ApiError;

    expect(error.kind).toBe('network');
    expect(error.retryable).toBe(true);
  });

  it('호출부가 취소한 요청은 ApiError로 승격하지 않는다', async () => {
    // React Query가 언마운트 시 취소하는 정상 경로.
    // 여기서 오류를 만들면 화면에 불필요한 에러가 뜬다.
    const controller = new AbortController();
    controller.abort();
    const cancelled = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cancelled));

    await expect(request('/x', Schema, { signal: controller.signal })).rejects.toBe(cancelled);
  });
});
