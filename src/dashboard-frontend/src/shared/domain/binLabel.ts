import type { Bin, Line, ShortageEvent } from './types';

/**
 * 칸(bin) 이름을 사람이 읽는 표기로 바꾼다.
 *
 * 데이터의 label은 'a'인데 현장에서 부르는 이름은 'A칸'이다. 이 변환을 화면마다
 * 따로 쓰면 어디는 'a칸', 어디는 'A칸'으로 갈라지므로 한 곳에서만 만든다.
 */
export function formatBinLabel(bin: Pick<Bin, 'label'>): string {
  return `${bin.label.toUpperCase()}칸`;
}

/** 부족 이벤트가 가리키는 칸을 화면에 쓸 수 있는 형태로 풀어둔 것. */
export interface ShortageBinInfo {
  /** 그대로 문구에 넣는 표기 — "A칸" */
  label: string;
  /**
   * 그 칸에 지금 쌓는 부품. 이벤트의 partName은 감지 시점에 박제된 값이라
   * 칸의 부품이 바뀌면 어긋난다 — 칸을 찾았다면 이쪽이 현재 값이다.
   */
  partName: string;
}

/**
 * 부족 이벤트가 어느 칸의 것인지 스냅샷의 라인에서 찾아 표기로 바꾼다.
 *
 * binId는 line-a처럼 칸 단위로 부족을 판정하는 라인에서만 채워진다. 그래서
 * "칸을 모른다"가 정상 경로이고, 그때는 null을 돌려 호출부가 기존 문구를
 * 그대로 쓰게 한다 — 시뮬레이션 라인(b~f) 알림 문구는 한 글자도 바뀌지 않는다.
 *
 * 스냅샷에 그 칸이 아직 없을 때도 같은 이유로 null이다. 없는 칸의 이름을
 * binId 문자열로 지어내면 화면에 'line-a-bin-a칸' 같은 내부 id가 새어 나간다.
 */
export function describeShortageBin(
  line: Line | undefined,
  event: Pick<ShortageEvent, 'binId'>,
): ShortageBinInfo | null {
  if (!event.binId) return null;

  const bin = line?.bins.find((item) => item.id === event.binId);
  if (!bin) return null;

  return { label: formatBinLabel(bin), partName: bin.partName };
}
