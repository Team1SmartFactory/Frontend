import type { RobotStatus } from '../../shared/domain/types';
import { useEscapeKey } from '../../shared/hooks/useEscapeKey';
import { useResumeRobot } from '../../shared/query/useRobotMutations';
import { Badge, Button, StatusLed } from '../../shared/ui';
import { formatClock } from '../../shared/utils/formatTime';
import { formatRobotLabel } from './robotLabel';
import styles from './RobotBlockedModal.module.css';

interface RobotBlockedModalProps {
  /** 지금 멈춰 있는 로봇. 큐에서 한 대씩 넘어온다. */
  robot: RobotStatus;
  /** 멈춰 있는 전체 대수. 1이면 표시하지 않는다. */
  blockedCount: number;
  onClose: () => void;
}

/**
 * 작업에 실패한 팔이 스스로 대기 자세로 물러났을 때 뜨는 팝업.
 *
 * 이 상태는 화면 어디에도 드러나지 않으면 "로봇이 조용히 아무 일도 안 하는"
 * 것으로 보인다 — 부족 알림은 계속 쌓이는데 아무도 이유를 모른다. 그래서
 * 부족 승인 팝업과 같은 문법(모든 뷰 위, 상태색 테두리)으로 띄우고, 사람이
 * 원인을 확인한 뒤 한 번 눌러 되살릴 수 있게 한다.
 *
 * 닫히는 조건은 오직 "로봇이 더 이상 blocked가 아니다"이다(useBlockedRobotQueue).
 * 복구 버튼의 응답만 믿고 닫으면, 명령은 받았지만 팔이 실제로는 살아나지 못한
 * 경우 화면만 정상으로 보이게 된다.
 */
export function RobotBlockedModal({ robot, blockedCount, onClose }: RobotBlockedModalProps) {
  const resume = useResumeRobot();

  useEscapeKey(onClose);

  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="robot-blocked-title"
      >
        <header className={styles.header}>
          <span className={styles.eyebrow}>
            <StatusLed tone="serious" />
            로봇 작업 정지
          </span>
          {blockedCount > 1 && <Badge tone="idle">정지 {blockedCount}대</Badge>}
        </header>

        <h2 id="robot-blocked-title" className={styles.title}>
          {formatRobotLabel(robot.robotId)}
        </h2>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>로봇 id</dt>
            <dd>{robot.robotId}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>정지 시각</dt>
            <dd>{formatClock(robot.updatedAt)}</dd>
          </div>
        </dl>

        {/*
          팔이 남긴 원문. 번역하거나 요약하지 않는다 — 현장에서 원인을 찾을 때
          쓰는 단서라, 다듬는 순간 로그와 대조할 수 없게 된다.
        */}
        {robot.blockedReason && <p className={styles.reason}>{robot.blockedReason}</p>}

        <p className={styles.note}>
          이 로봇은 작업에 실패한 뒤 스스로 멈춰 더 이상 새 작업을 받지 않습니다.
          현장에서 원인을 확인한 뒤 복구를 누르면 다시 작업을 받습니다. 복구할 때까지
          이 로봇이 맡은 보충 작업은 진행되지 않습니다.
        </p>

        {/*
          복구 실패. 팝업은 그대로 열어 둔다 — 로봇은 여전히 멈춰 있으므로
          여기서 창을 닫으면 사람이 손쓸 자리가 사라진다.
        */}
        {resume.isError && (
          <div className={styles.error} role="alert">
            <p className={styles.errorMessage}>복구 요청이 실패했습니다.</p>
            <p className={styles.errorDetail}>{resume.error.message}</p>
          </div>
        )}

        {/*
          요청은 갔지만 로봇은 아직 멈춤 상태. 이 팝업이 남아 있다는 사실 자체가
          "아직 안 살아났다"는 뜻이므로, 버튼을 다시 누르기 전에 그 이유를 말해 준다.
        */}
        {resume.isSuccess && (
          <p className={styles.pendingNote} role="status">
            복구 요청을 보냈습니다. 로봇이 다시 작업을 받으면 이 창은 자동으로 닫힙니다.
          </p>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="primary"
            disabled={resume.isPending}
            onClick={() => resume.mutate({ robotId: robot.robotId })}
          >
            {resume.isPending ? '복구 중…' : resume.isError ? '다시 복구' : '복구'}
          </Button>
        </div>
      </div>
    </div>
  );
}
