import { describe, expect, it } from 'vitest';
import { ApiError, extractFastApiDetail, extractNotReadyDetail } from './ApiError';

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

  it('구조화된 거부(409)는 message 한 줄을 문구로 쓴다', () => {
    expect(
      extractFastApiDetail({ detail: { message: '보관소가 준비되지 않았습니다', reasons: [] } }),
    ).toBe('보관소가 준비되지 않았습니다');
  });

  it('detail이 없거나 형태가 다르면 null을 돌려 호출부가 기본 문구를 쓰게 한다', () => {
    expect(extractFastApiDetail(null)).toBeNull();
    expect(extractFastApiDetail({ message: 'oops' })).toBeNull();
    expect(extractFastApiDetail({ detail: { nested: true } })).toBeNull();
    expect(extractFastApiDetail({ detail: [] })).toBeNull();
  });
});

describe('extractNotReadyDetail', () => {
  it('창고 미준비 409의 message와 reasons를 꺼낸다', () => {
    const body = {
      detail: {
        message: '보관소가 아직 부품을 낼 수 없습니다',
        reasons: ['보관소에 M6 볼트 세트가 없습니다', 'Beagle이 보관소에 있지 않습니다'],
        checks: { hasPart: false, amrDocked: false },
      },
    };

    expect(extractNotReadyDetail(body)).toEqual({
      message: '보관소가 아직 부품을 낼 수 없습니다',
      reasons: ['보관소에 M6 볼트 세트가 없습니다', 'Beagle이 보관소에 있지 않습니다'],
    });
  });

  it('reasons가 없거나 문자열이 아니면 빈 배열로 두고 message만 살린다', () => {
    expect(extractNotReadyDetail({ detail: { message: '준비되지 않았습니다' } })?.reasons).toEqual([]);
    expect(
      extractNotReadyDetail({ detail: { message: '준비되지 않았습니다', reasons: [1, '진짜 사유'] } })
        ?.reasons,
    ).toEqual(['진짜 사유']);
  });

  it('같은 409라도 문자열 detail("이미 승인됨")은 이쪽이 아니다', () => {
    // 사용자가 할 일이 정반대라 반드시 갈라져야 한다 — 이쪽은 다시 눌러도 소용없다.
    expect(extractNotReadyDetail({ detail: '이미 승인된 부족 이벤트입니다' })).toBeNull();
  });

  it('형태가 다르면 null이다', () => {
    expect(extractNotReadyDetail(null)).toBeNull();
    expect(extractNotReadyDetail({ detail: [{ msg: '필수 항목입니다' }] })).toBeNull();
    expect(extractNotReadyDetail({ detail: { reasons: ['사유만 있음'] } })).toBeNull();
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
