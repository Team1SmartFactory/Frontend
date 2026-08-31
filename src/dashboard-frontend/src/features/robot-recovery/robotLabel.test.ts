import { describe, expect, it } from 'vitest';
import { formatRobotLabel } from './robotLabel';

describe('formatRobotLabel', () => {
  it('라인 하역 팔은 어느 라인인지로 부른다', () => {
    expect(formatRobotLabel('omxf-line-a')).toBe('A라인 OMX-F');
  });

  it('보관소·운반 로봇은 지정된 이름으로 부른다', () => {
    expect(formatRobotLabel('omxf-storage-1')).toBe('보관소 OMX-F');
    expect(formatRobotLabel('beagle-1')).toBe('Beagle 운반 로봇');
  });

  it('모르는 id는 지어내지 않고 그대로 보여준다', () => {
    // 없는 이름을 만들면 화면의 호칭과 현장의 호칭이 갈라진다.
    expect(formatRobotLabel('omxf-line-zz-2')).toBe('omxf-line-zz-2');
  });
});
