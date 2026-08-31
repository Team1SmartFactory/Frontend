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
  /**
   * 원본 예외 또는 오류 응답 본문. 그대로 화면에 뿌리지 않고, 필요한 화면이
   * extractNotReadyDetail 같은 파서로 자기가 아는 형태만 꺼내 쓴다.
   */
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
 * FastAPI는 세 가지 형태로 detail을 보낸다.
 *   HTTPException      → { "detail": "부족 이벤트를 찾을 수 없습니다" }
 *   RequestValidation  → { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
 *   구조화된 거부(409)  → { "detail": { "message": "...", "reasons": [...], "checks": {...} } }
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

  return extractNotReadyDetail(body)?.message ?? null;
}

/**
 * 승인은 받았지만 창고가 그것을 실행할 수 없는 상태(409)의 본문.
 * checks는 백엔드 진단용이라 화면이 읽지 않는다 — 사람에게 보여줄 것은
 * 한 줄 요약(message)과 고쳐야 할 항목들(reasons)뿐이다.
 */
export interface NotReadyDetail {
  message: string;
  reasons: string[];
}

/**
 * "창고가 준비되지 않음" 409를 그 외의 409와 갈라낸다.
 *
 * 같은 409라도 "이미 승인/반려된 건"은 detail이 문자열이고(다시 눌러도 소용없다),
 * 이쪽은 객체다(현장을 고치고 다시 누르면 된다). 사용자가 할 일이 정반대라서
 * 상태 코드가 아니라 detail의 형태로 구분해야 한다.
 *
 * message가 문자열인 객체일 때만 인정한다. reasons가 빠졌거나 문자열이 아닌
 * 항목이 섞여 있어도 message만으로 화면은 제 일을 하므로, 통째로 버리지 않는다.
 */
export function extractNotReadyDetail(body: unknown): NotReadyDetail | null {
  if (typeof body !== 'object' || body === null || !('detail' in body)) return null;

  const { detail } = body as { detail: unknown };
  if (typeof detail !== 'object' || detail === null || Array.isArray(detail)) return null;

  const { message, reasons } = detail as { message?: unknown; reasons?: unknown };
  if (typeof message !== 'string' || message.length === 0) return null;

  return {
    message,
    reasons: Array.isArray(reasons) ? reasons.filter((r): r is string => typeof r === 'string') : [],
  };
}
