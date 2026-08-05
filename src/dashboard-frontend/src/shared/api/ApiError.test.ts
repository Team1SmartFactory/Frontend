import { describe, expect, it } from 'vitest';
import { ApiError, extractFastApiDetail } from './ApiError';

describe('extractFastApiDetail', () => {
  it('HTTPException의 문자열 detail을 그대로 꺼낸다', () => {
    expect(extractFastApiDetail({ detail: '부족 이벤트를 찾을 수 없습니다' })).toBe(
      '부족 이벤트를 찾을 수 없습니다',
    );
  });

  it('검증 오류(422)의 배열 detail을 msg만 모아 합친다', () => {
    const body = {
      detail: [
        { loc: ['body', 'approvedBy'], msg: 'field required', type: 'value_error.missing' },
        { loc: ['body', 'qty'], msg: 'not a valid integer', type: 'type_error.integer' },
      ],
    };

    expect(extractFastApiDetail(body)).toBe('field required, not a valid integer');
  });

  it('msg가 없는 항목은 건너뛴다', () => {
    expect(extractFastApiDetail({ detail: [{ loc: ['body'] }, { msg: '필수 항목입니다' }] })).toBe(
      '필수 항목입니다',
    );
  });

  it('detail이 없거나 형태가 다르면 null을 돌려 호출부가 기본 문구를 쓰게 한다', () => {
    expect(extractFastApiDetail(null)).toBeNull();
    expect(extractFastApiDetail({ message: 'oops' })).toBeNull();
    expect(extractFastApiDetail({ detail: { nested: true } })).toBeNull();
    expect(extractFastApiDetail({ detail: [] })).toBeNull();
  });
});

describe('ApiError.retryable', () => {
  function make(kind: ConstructorParameters<typeof ApiError>[0]['kind']): ApiError {
    return new ApiError({ kind, message: 'x', path: '/snapshot' });
  }

  it('네트워크 실패와 5xx는 재시도할 가치가 있다', () => {
    expect(make('network').retryable).toBe(true);
    expect(make('server').retryable).toBe(true);
  });

  it('4xx와 계약 불일치는 같은 요청을 다시 보내도 결과가 같으므로 재시도하지 않는다', () => {
    expect(make('client').retryable).toBe(false);
    expect(make('contract').retryable).toBe(false);
  });
});
