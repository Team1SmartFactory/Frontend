/** 시각 표기를 한곳에서 통일한다. 화면마다 포맷이 달라지는 것을 막는 목적. */

const TIME_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/** 로그·타임라인용 시:분:초 */
export function formatClock(iso: string): string {
  return TIME_FORMAT.format(new Date(iso));
}

/** 소요 시간(초)을 "1분 49초 / 43초"로. KPI 카드의 리드타임 표기용. */
export function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  if (whole < 60) return `${whole}초`;
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest > 0 ? `${minutes}분 ${rest}초` : `${minutes}분`;
}

/** "방금 전 / N분 전"처럼 경과 시간을 사람이 읽는 형태로 바꾼다. */
export function formatElapsed(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));

  if (seconds < 10) return '방금 전';
  if (seconds < 60) return `${seconds}초 전`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  return `${Math.floor(minutes / 60)}시간 전`;
}
