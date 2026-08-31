import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RobotStatus } from '../../shared/domain/types';
import { useRobots } from '../../shared/query/useFactoryData';
import { selectBlockedRobots } from '../../store/selectors';

export interface BlockedRobotQueue {
  /** 지금 팝업이 보여줘야 할 로봇. 없으면 팝업을 띄우지 않는다. */
  current?: RobotStatus;
  /** 멈춰 있는 전체 대수. 여러 대면 팝업이 '남은 대수'를 알려 준다. */
  blockedCount: number;
  /** 이 로봇의 팝업을 접는다. 로봇이 복구되기 전까지 다시 뜨지 않는다. */
  dismiss: () => void;
}

/**
 * 멈춰 선 팔들을 한 대씩 처리하는 큐. (승인 팝업 큐와 같은 방식)
 *
 * 상태의 근거는 언제나 스냅샷/WebSocket이 채운 Query 캐시다. 복구 버튼의 응답을
 * 따로 들고 있지 않으므로, 로봇이 다시 대기 상태가 됐다는 robot.status가 오면
 * 이 훅이 그 로봇을 큐에서 빼고 팝업은 스스로 사라진다.
 */
export function useBlockedRobotQueue(): BlockedRobotQueue {
  const { robots } = useRobots();
  const blocked = useMemo(() => selectBlockedRobots(robots), [robots]);

  /** 관리자가 '닫기'로 접어 둔 로봇들. */
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  /*
   * 배열은 렌더마다 새로 만들어져 의존성으로 쓸 수 없으므로, 내용이 실제로
   * 바뀌었을 때만 효과가 돌도록 문자열 키로 바꿔서 본다.
   */
  const blockedIdKey = blocked.map((robot) => robot.robotId).join(',');

  useEffect(() => {
    // 복구된 로봇의 '닫기' 기록은 지운다 — 같은 팔이 또 멈추면 다시 알려야 한다.
    const stillBlocked = new Set(blockedIdKey.split(',').filter(Boolean));
    setDismissedIds((prev) => {
      const next = prev.filter((id) => stillBlocked.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [blockedIdKey]);

  const current = blocked.find((robot) => !dismissedIds.includes(robot.robotId));

  const dismiss = useCallback(() => {
    if (!current) return;
    setDismissedIds((prev) => (prev.includes(current.robotId) ? prev : [...prev, current.robotId]));
  }, [current]);

  return { current, blockedCount: blocked.length, dismiss };
}
