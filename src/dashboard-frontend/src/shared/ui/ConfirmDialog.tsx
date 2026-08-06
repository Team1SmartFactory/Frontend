import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Button } from './Button';
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
  /** 요청이 진행 중이면 연타를 막는다. */
  busy?: boolean;
  /**
   * 판단 근거로 카메라처럼 넓은 것을 넣어 세로로 길어질 때 켠다.
   * 팝업 폭을 넓혀 children이 2단으로 배치될 여지를 만든다 — 단을 나누는 것은
   * 내용을 아는 호출부의 몫이라 여기서는 폭만 내어 준다.
   */
  wide?: boolean;
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
  busy = false,
  wide = false,
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
        data-wide={wide}
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
