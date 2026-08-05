/**
 * API 계층에서 발생하는 모든 실패를 하나의 타입으로 모은다.
 *
 * 호출부(쿼리 훅, 컴포넌트)가 fetch 예외 / HTTP 상태 / 스키마 불일치를
 * 각각 다르게 처리하지 않아도 되게 하려는 목적이다.
 * 화면에는 message를, 로깅에는 cause를 쓴다.
 */
export type ApiErrorKind =
  /** 네트워크 자체가 실패 (오프라인, DNS, CORS, 타임아웃) */
  | 'network'
  /** 요청은 닿았으나 4xx */
  | 'client'
  /** 요청은 닿았으나 5xx */
  | 'server'
  /** 200을 받았지만 응답 형태가 계약과 다름 */
  | 'contract';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly path: string;
  /** 원본 예외 또는 zod 이슈. 로깅용이며 화면에 그대로 노출하지 않는다. */
  readonly detail?: unknown;

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    path: string;
    status?: number;
    detail?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status;
    this.path = params.path;
    this.detail = params.detail;
  }

  /**
   * 재시도가 의미 있는 실패인지.
   * 4xx는 같은 요청을 다시 보내도 같은 결과라 재시도하지 않는다.
   * 계약 불일치도 마찬가지로 백엔드가 고쳐야 하는 문제다.
   */
  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'server';
  }
}

/**
 * FastAPI의 오류 응답에서 사람이 읽을 문구를 뽑는다.
 *
 * FastAPI는 두 가지 형태로 detail을 보낸다.
 *   HTTPException      → { "detail": "부족 이벤트를 찾을 수 없습니다" }
 *   RequestValidation  → { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
 * 어느 쪽이든 안전하게 문자열로 환원하고, 형태가 다르면 null을 돌려
 * 호출부가 기본 문구를 쓰게 한다.
 */
export function extractFastApiDetail(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('detail' in body)) return null;

  const { detail } = body as { detail: unknown };

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        typeof item === 'object' && item !== null && 'msg' in item
          ? String((item as { msg: unknown }).msg)
          : null,
      )
      .filter((msg): msg is string => Boolean(msg));

    return messages.length > 0 ? messages.join(', ') : null;
  }

  return null;
}
