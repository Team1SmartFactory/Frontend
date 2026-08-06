import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Button } from './Button';
import type { Tone } from './tone';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  /** 확인하면 무엇이 달라지는지 한 줄. 되돌릴 수 있는지도 여기에 적는다. */
  description?: ReactNode;
  /** 판단 근거로 함께 보여줄 것 (카메라 화면, 현재 값 등). */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** 확인 버튼 성격. 로봇을 움직이는 등 되돌리기 번거로운 동작은 'danger'. */
  confirmVariant?: 'primary' | 'danger';
  /** 테두리 색. 어떤 상태에 대한 확인인지 색으로도 읽히게 한다. */
  tone?: Tone;
  /** 요청이 진행 중이면 연타를 막는다. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * "이대로 진행할까요?"를 묻는 공용 확인 팝업.
 *
 * ShortageApprovalModal(승인 요청)과 달리 이쪽은 사용자가 먼저 행동을 걸었을 때 뜨므로,
 * Esc와 배경 클릭으로 취소할 수 있다. 승인 팝업은 놓치면 안 되는 알림이라 일부러 막아 두었다.
 */
export function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = '취소',
  confirmVariant = 'primary',
  tone = 'accent',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // 고정 id를 쓰면 팝업이 두 개 열릴 때 라벨 연결이 첫 번째로 몰린다.
  const titleId = useId();

  useEscapeKey(onCancel, !busy);

  // 팝업이 열렸음을 보조기기에 알리려면 초점이 안으로 들어와야 한다.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>): void {
    if (busy) return;
    // 팝업 안쪽 클릭이 배경까지 올라와 닫아 버리지 않게 한다.
    if (event.target === event.currentTarget) onCancel();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        data-tone={tone}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}

        {children && <div className={styles.body}>{children}</div>}

        <div className={styles.actions}>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} disabled={busy} onClick={onConfirm}>
            {busy ? '처리 중…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
