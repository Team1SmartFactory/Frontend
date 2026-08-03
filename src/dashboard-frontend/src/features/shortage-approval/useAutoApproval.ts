import { useEffect, useRef } from 'react';
import type { ShortageEvent } from '../../shared/domain/types';

/**
 * 설정 탭에서 "관리자 승인 필수"를 끈 경우의 자동 동작.
 *
 * 승인 팝업을 띄우는 대신 감지된 부족 건을 즉시 승인 처리한다.
 * approve()가 스토어를 갱신하면 이 훅이 다시 실행되므로,
 * 이미 처리한 id를 ref에 기록해 같은 건을 두 번 승인하지 않게 한다.
 */
export function useAutoApproval(
  pendingEvents: ShortageEvent[],
  enabled: boolean,
  approve: (id: string) => Promise<void>,
): void {
  const handledIds = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) {
      // 수동 승인으로 되돌아오면 기록을 비워, 다시 껐을 때 정상 동작하게 한다.
      handledIds.current.clear();
      return;
    }

    pendingEvents.forEach((event) => {
      if (handledIds.current.has(event.id)) return;
      handledIds.current.add(event.id);
      void approve(event.id);
    });
  }, [pendingEvents, enabled, approve]);
}
