/**
 * Tone — 디자인 시스템의 의미 색상 축.
 *
 * UI 컴포넌트는 "빨강/노랑"이 아니라 Tone으로만 색을 받는다.
 * 도메인 상태(재고율, 로봇 상태 등)를 Tone으로 바꾸는 규칙은
 * shared/domain/statusTone.ts 한 곳에 모아 두어, 색 기준이 흩어지지 않게 한다.
 */
export type Tone = 'accent' | 'good' | 'warning' | 'serious' | 'critical' | 'idle';
