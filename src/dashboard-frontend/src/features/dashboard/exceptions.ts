import { ROBOT_STATE_LABEL, SHORTAGE_STATUS_LABEL, toneForLine } from '../../shared/domain/statusTone';
import type { Camera, Line, RobotStatus, ShortageEvent } from '../../shared/domain/types';
import type { Tone } from '../../shared/ui/tone';

/**
 * 대시보드 알림 섹션이 잡는 예외들.
 *
 * 승인 대기 건은 여기 들어오지 않는다. 그것은 모든 뷰 위에 뜨는 ShortageApprovalModal의
 * 몫이고, 실제로 승인 대기가 생기는 순간이 곧 모달이 화면을 덮는 순간이라
 * 섹션에 적어 봐야 사람이 볼 수 없다. 이 섹션은 반대로 "팝업을 띄울 만큼 급하지는
 * 않지만 방치하면 안 되는 것"만 맡는다.
 */
export type ExceptionKind =
  | 'camera_offline'
  | 'robot_down'
  | 'transit_stalled'
  | 'line_near_threshold';

export interface DashboardException {
  id: string;
  kind: ExceptionKind;
  tone: Tone;
  headline: string;
  detail: string;
  /** 경과 시간을 붙일 기준 시각. 시점이 없는 예외(임계치 근접)는 비운다. */
  since?: string;
}

/**
 * 보충 지시가 나간 뒤 이만큼 지나도 끝나지 않으면 멈춘 것으로 본다.
 * 로봇이 조용히 멈춰 서면 아무 상태도 바뀌지 않으므로, 시간 말고는 알아챌 방법이 없다.
 */
const STALL_MINUTES = 10;

/** 급한 것이 위로. 같은 톤 안에서는 넣은 순서를 지킨다(Array.sort는 안정 정렬). */
const TONE_ORDER: Record<Tone, number> = {
  critical: 0,
  serious: 1,
  warning: 2,
  accent: 3,
  good: 4,
  idle: 5,
};

function minutesSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / 60_000);
}

/**
 * 지금 화면 어디에도 드러나지 않는 이상 신호를 한 목록으로 모은다.
 *
 * 넷 다 이미 받아 오고 있는 데이터에서 파생될 뿐 새 API를 필요로 하지 않는다.
 * 특히 카메라 online은 스키마에 있으면서 화면에서 한 번도 읽지 않던 값이었다 —
 * 이 제품은 "카메라를 보고 승인한다"가 핵심이라, 카메라가 죽은 줄 모르고 승인하면
 * 근거 없이 로봇을 움직이게 된다.
 */
export function selectExceptions(
  input: {
    cameras: Camera[];
    robots: RobotStatus[];
    lines: Line[];
    shortageEvents: ShortageEvent[];
  },
  now: number = Date.now(),
): DashboardException[] {
  const lineName = new Map(input.lines.map((line) => [line.id, line.name]));
  const found: DashboardException[] = [];

  input.cameras
    .filter((camera) => !camera.online)
    .forEach((camera) => {
      const where = camera.lineId ? (lineName.get(camera.lineId) ?? camera.lineId) : '공장 전체';
      found.push({
        id: `camera_offline:${camera.id}`,
        kind: 'camera_offline',
        tone: 'critical',
        headline: `${camera.label} 카메라 오프라인`,
        detail: `${where} · 승인 판단의 근거 영상이 없습니다`,
      });
    });

  input.robots
    .filter((robot) => robot.state === 'error' || robot.state === 'offline')
    .forEach((robot) => {
      found.push({
        id: `robot_down:${robot.robotId}`,
        kind: 'robot_down',
        // 오류는 지금 멈춰 선 것이고, 오프라인은 애초에 배차되지 않는다. 앞이 더 급하다.
        tone: robot.state === 'error' ? 'critical' : 'serious',
        headline: `${robot.robotId} ${ROBOT_STATE_LABEL[robot.state]}`,
        detail: robot.currentTaskId
          ? `작업 ${robot.currentTaskId} 중단됨`
          : '배정된 작업 없음',
        since: robot.updatedAt,
      });
    });

  input.shortageEvents
    .filter((event) => event.status === 'dispatched' || event.status === 'in_transit')
    .forEach((event) => {
      const startedAt = event.approvedAt ?? event.detectedAt;
      const elapsed = minutesSince(startedAt, now);
      if (elapsed < STALL_MINUTES) return;
      found.push({
        id: `transit_stalled:${event.id}`,
        kind: 'transit_stalled',
        tone: 'warning',
        headline: `${lineName.get(event.lineId) ?? event.lineId} 보충 지연`,
        detail: `${SHORTAGE_STATUS_LABEL[event.status]} 상태로 ${elapsed}분째 · ${event.partName}`,
        since: startedAt,
      });
    });

  // toneForLine이 'serious'로 보는 구간 = 아직 부족은 아니지만 임계치의 1.5배 안.
  // 부족(critical)과 보충 중(accent)은 이미 다른 화면이 맡고 있으므로 여기 넣지 않는다.
  input.lines
    .filter((line) => toneForLine(line) === 'serious')
    .forEach((line) => {
      found.push({
        id: `line_near_threshold:${line.id}`,
        kind: 'line_near_threshold',
        tone: 'warning',
        headline: `${line.name} 임계치 근접`,
        detail: `현재 ${line.currentQty}% · 임계치 ${line.threshold}%`,
      });
    });

  return found.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
}
