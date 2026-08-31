import { RobotBlockedModal } from '../features/robot-recovery/RobotBlockedModal';
import { useBlockedRobotQueue } from '../features/robot-recovery/useBlockedRobotQueue';
import { ShortageApprovalModal } from '../features/shortage-approval/ShortageApprovalModal';

/**
 * 모든 뷰 위에 뜨는 팝업들의 우선순위를 정하는 한 곳.
 *
 * 두 팝업은 같은 자리(화면 한가운데 오버레이)를 쓰므로 동시에 뜨면 서로를 가린다.
 * 로봇 정지가 앞선다 — 팔이 멈춰 있는 동안에는 부족을 승인해도 그 로봇이 작업을
 * 받지 못해 아무 일도 일어나지 않는다. 승인부터 받으면 관리자는 "승인했는데 왜
 * 안 오지"를 겪게 되고, 진짜 원인(멈춘 팔)은 그 뒤에 가려진다.
 * 정지 팝업을 닫으면(닫기) 곧바로 승인 팝업이 나오므로 부족 건이 밀리지도 않는다.
 *
 * 레이아웃(TabLayout)이 아니라 이 작은 컴포넌트가 로봇 상태를 구독하는 이유는
 * 리렌더 범위 때문이다 — 로봇 위치는 초당 여러 번 갱신되므로, 레이아웃이 직접
 * 구독하면 그때마다 탭 본문 전체가 다시 렌더된다.
 */
export function OperatorModals() {
  const { current, blockedCount, dismiss } = useBlockedRobotQueue();

  return (
    <>
      {current && (
        // key: 다음 로봇으로 넘어갈 때 이전 로봇의 복구 실패 메시지를 물려받지 않는다.
        <RobotBlockedModal
          key={current.robotId}
          robot={current}
          blockedCount={blockedCount}
          onClose={dismiss}
        />
      )}

      {/*
        정지 팝업이 떠 있는 동안에도 계속 렌더한다 — 화면만 접힐 뿐 승인 큐와
        자동 승인은 그대로 돌아야 한다. (ShortageApprovalModal의 hidden 주석 참고)
      */}
      <ShortageApprovalModal hidden={Boolean(current)} />
    </>
  );
}
