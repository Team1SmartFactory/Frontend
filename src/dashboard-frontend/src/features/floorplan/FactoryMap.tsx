import type { KeyboardEvent } from 'react';
import type { Line, RobotStatus, RobotType } from '../../shared/domain/types';
import { toneForLine, toneForRobotState } from '../../shared/domain/statusTone';
import { EquipmentGlyph } from './EquipmentGlyph';
import { MapLed } from './MapLed';
import { DOORS, FLOOR_ZONES, SHELL, VIEW, toViewX, toViewY, type FloorZone } from './floorPlanLayout';
import styles from './FactoryMap.module.css';

interface FactoryMapProps {
  lines: Line[];
  robots: RobotStatus[];
  /** 승인 대기(pending_approval) 부족 건이 걸린 라인 — 경보색(빨강) 유지 대상. */
  pendingLineIds: Set<string>;
  /** 승인이 떨어져 보충이 진행 중(dispatched/in_transit)인 라인 — '보충 중'(파랑). */
  restockingLineIds: Set<string>;
  /** 위 두 집합의 칸(bin) 단위 판. 칸이 있는 라인만 해당된다 (이슈 #38). */
  pendingBinIds: Set<string>;
  restockingBinIds: Set<string>;
  selectedLineId: string | null;
  onSelectLine: (lineId: string) => void;
}

const ROBOT_LABEL: Record<RobotType, string> = {
  beagle: 'Beagle',
  omxf_storage: 'OMX-F 보관소',
  omxf_line: 'OMX-F 라인',
};

/**
 * 공장 평면도.
 *
 * 도면(외벽·구역·설비)은 floorPlanLayout.ts의 좌표를 그대로 그리는 정적 레이어이고,
 * 그 위에 실시간 상태(부족 LED·로봇 위치)를 얹는 2층 구조다.
 * 배치가 바뀌면 레이아웃 데이터만 고치면 되고, 상태 표시 코드는 영향을 받지 않는다.
 */
export function FactoryMap({
  lines,
  robots,
  pendingLineIds,
  restockingLineIds,
  pendingBinIds,
  restockingBinIds,
  selectedLineId,
  onSelectLine,
}: FactoryMapProps) {
  const lineById = new Map(lines.map((line) => [line.id, line]));

  return (
    <div className={styles.stage}>
      <svg
        className={styles.map}
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="공장 평면도"
      >
        <FactoryShell />

        {FLOOR_ZONES.map((zone) => (
          <ZoneLayer
            key={zone.label}
            zone={zone}
            line={zone.lineId ? lineById.get(zone.lineId) : undefined}
            hasPending={Boolean(zone.lineId && pendingLineIds.has(zone.lineId))}
            hasRestocking={Boolean(zone.lineId && restockingLineIds.has(zone.lineId))}
            pendingBinIds={pendingBinIds}
            restockingBinIds={restockingBinIds}
            selected={zone.lineId === selectedLineId}
            onSelect={onSelectLine}
          />
        ))}

        {/* 위치가 한 번도 보고되지 않은 로봇은 그리지 않는다 (이슈 #42) — 백엔드
            기본값이 (0,0)이라, 위치를 안 보내는 로봇 전부(시뮬레이션 포함 19대)가
            좌상단 구석에 라벨째 겹겹이 쌓인다. 실기 팔의 자리는 구역 안 설비
            글리프가 이미 보여주고, TELEMETRY가 실제로 들어오기 시작하면 이 필터를
            그대로 통과해 다시 나타난다. */}
        {robots
          .filter((robot) => robot.position.x !== 0 || robot.position.y !== 0)
          .map((robot) => (
            <RobotNode key={robot.robotId} robot={robot} />
          ))}
      </svg>
    </div>
  );
}

/** 외벽과 출입구. 벽은 바깥/안쪽 사각형 두 장으로 두께를 만든다. */
function FactoryShell() {
  const { outer, thickness } = SHELL;
  const inner = {
    x: outer.x + thickness,
    y: outer.y + thickness,
    width: outer.width - thickness * 2,
    height: outer.height - thickness * 2,
  };

  return (
    <g>
      <rect {...outer} rx={3} className={styles.wall} />
      <rect {...inner} className={styles.floor} />

      {DOORS.map((door) => {
        const isTop = door.side === 'top';
        // 벽을 끊어 개구부를 만들고, 문이 열리는 방향을 호로 표시한다.
        const gap = isTop
          ? { x: outer.x + door.at, y: outer.y, width: door.length, height: thickness }
          : { x: outer.x + outer.width - thickness, y: outer.y + door.at, width: thickness, height: door.length };

        const swing = isTop
          ? `M${gap.x} ${gap.y} a${door.length} ${door.length} 0 0 1 ${door.length} ${door.length}`
          : `M${gap.x + thickness} ${gap.y} a${door.length} ${door.length} 0 0 1 ${door.length} ${door.length}`;

        return (
          <g key={door.id}>
            <rect {...gap} className={styles.doorGap} />
            <path d={swing} className={styles.doorSwing} />
          </g>
        );
      })}
    </g>
  );
}

interface ZoneLayerProps {
  zone: FloorZone;
  line?: Line;
  hasPending: boolean;
  hasRestocking: boolean;
  pendingBinIds: Set<string>;
  restockingBinIds: Set<string>;
  selected: boolean;
  onSelect: (lineId: string) => void;
}

const LABEL_CHIP = { width: 108, height: 34, inset: 14 } as const;

function ZoneLayer({
  zone,
  line,
  hasPending,
  hasRestocking,
  pendingBinIds,
  restockingBinIds,
  selected,
  onSelect,
}: ZoneLayerProps) {
  const { rect } = zone;
  // 보관소는 라인이 아니므로 선택 대상이 아니다.
  const interactive = Boolean(zone.lineId);
  const tone = line ? toneForLine(line) : 'idle';
  const centerX = rect.x + rect.width / 2;
  const chipWidth = zone.lineId ? LABEL_CHIP.width : LABEL_CHIP.width * 1.5;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>): void {
    if (!zone.lineId) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(zone.lineId);
    }
  }

  return (
    <g
      className={interactive ? styles.zoneInteractive : styles.zone}
      data-tone={interactive ? tone : undefined}
      data-selected={selected}
      onClick={interactive && zone.lineId ? () => onSelect(zone.lineId as string) : undefined}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive && line
          ? `${line.name}, 재고 ${line.currentQty.toFixed(0)}퍼센트${
              hasPending ? ', 부품 부족' : hasRestocking ? ', 보충 중' : ''
            }`
          : zone.label
      }
    >
      <rect {...rect} rx={4} className={interactive ? styles.zoneBox : styles.zoneBoxStatic} />

      {zone.equipment.map((item, index) => {
        // binLabel이 있는 설비만 그 칸의 실제 상태색을 받는다 — 나머지는
        // 항상 중립(라인 전체 상태와 무관, 이슈: "칸별로 따로 알아보이게").
        const bin = item.binLabel ? line?.bins.find((b) => b.label === item.binLabel) : undefined;
        // 아직 안 끝난 건이 걸린 칸은 재고 수치와 무관하게 그 건의 단계색으로
        // 고정한다: 승인 대기는 경보색(빨강), 승인 후 로봇이 움직이는 동안은
        // '보충 중'(파랑, 이슈 #38). 완료/반려로 건이 닫히면 강제색이 풀려 칸의
        // 실제 재고색(카메라 확인 후 정상)으로 돌아온다 — 구역 LED가 아래에서
        // 같은 기준으로 깜박이므로 칸과 LED가 서로 모순되지 않는다.
        const tone = bin
          ? pendingBinIds.has(bin.id)
            ? 'critical'
            : restockingBinIds.has(bin.id)
              ? 'accent'
              : toneForLine(bin)
          : undefined;
        return <EquipmentGlyph key={`${item.kind}-${index}`} {...item} tone={tone} />;
      })}

      {/* 라벨 칩: 원본 도면처럼 구역 안쪽 상단 중앙에 놓는다. */}
      <rect
        x={centerX - chipWidth / 2}
        y={rect.y + LABEL_CHIP.inset}
        width={chipWidth}
        height={LABEL_CHIP.height}
        rx={4}
        className={styles.labelChip}
      />
      <text
        x={centerX}
        y={rect.y + LABEL_CHIP.inset + LABEL_CHIP.height / 2 + 6}
        textAnchor="middle"
        className={styles.labelText}
      >
        {zone.label}
      </text>

      {/* 부족/보충 LED는 구역 우상단 안쪽에 둔다. 라벨 칩과 겹치지 않는 자리다.
          승인 대기가 하나라도 있으면 빨강이 이긴다 — 아직 사람 손이 필요한 건이
          로봇이 움직인다는 파랑에 가려지면 안 된다. */}
      {(hasPending || hasRestocking) && (
        <g transform={`translate(${rect.x + rect.width - 26}, ${rect.y + 26})`}>
          <MapLed tone={hasPending ? 'critical' : 'accent'} pulse radius={7} />
        </g>
      )}
    </g>
  );
}

function RobotNode({ robot }: { robot: RobotStatus }) {
  const tone = toneForRobotState(robot.state);
  const x = toViewX(robot.position.x);
  const y = toViewY(robot.position.y);
  const isBeagle = robot.type === 'beagle';

  return (
    <g transform={`translate(${x}, ${y})`} className={styles.robotGroup}>
      {isBeagle ? (
        // 이동체는 LED로 표시해 실시간 위치가 눈에 띄게 한다.
        <MapLed tone={tone} pulse={robot.state === 'moving'} radius={8} />
      ) : (
        <g data-tone={tone} className={styles.armMarker}>
          <rect x={-13} y={-13} width={26} height={26} rx={5} />
          <circle r={4} />
        </g>
      )}
      {/* 라벨은 마커 오른쪽에 둔다. 위에 두면 설비 선화와 겹쳐 읽히지 않는다. */}
      <text x={20} y={6} className={styles.robotLabel}>
        {ROBOT_LABEL[robot.type]}
      </text>
    </g>
  );
}
