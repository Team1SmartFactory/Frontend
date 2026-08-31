/**
 * 로봇 id를 현장에서 부르는 이름으로 바꾼다.
 *
 * 앱 어디에도 robotId → 이름 대응표가 없어(로봇 현황 패널도 id를 그대로 찍는다)
 * 여기서 처음 만든다. 팝업은 "지금 어느 팔이 멈췄는가"를 한 줄로 말해야 하는데,
 * `omxf-line-a` 같은 내부 id로는 관리자가 어느 라인으로 가야 할지 알 수 없다.
 *
 * 규칙에 맞지 않는 id는 지어내지 않고 그대로 보여준다. 없는 이름을 만들어 내면
 * 화면의 호칭과 현장의 호칭이 갈라져, 사람이 엉뚱한 설비 앞에 서게 된다.
 */

/** 규칙으로 풀리지 않는 한 대짜리 설비들. */
const FIXED_LABELS: Record<string, string> = {
  'omxf-storage-1': '보관소 OMX-F',
  'beagle-1': 'Beagle 운반 로봇',
};

/** 라인 하역 팔은 `omxf-line-a`처럼 라인 id를 뒤에 달고 온다. */
const LINE_ARM_PATTERN = /^omxf-line-([a-z])$/i;

export function formatRobotLabel(robotId: string): string {
  const fixed = FIXED_LABELS[robotId];
  if (fixed) return fixed;

  const lineArm = LINE_ARM_PATTERN.exec(robotId);
  if (lineArm?.[1]) return `${lineArm[1].toUpperCase()}라인 OMX-F`;

  return robotId;
}
