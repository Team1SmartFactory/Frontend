import styles from './CameraZoomModal.module.css';

interface CameraZoomModalProps {
  label: string;
  onClose: () => void;
}

/** 카메라 뷰 클릭 시 확대되는 팝업. */
export function CameraZoomModal({ label, onClose }: CameraZoomModalProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${label} 확대 화면`}>
      <div className={styles.dialog}>
        <header className={styles.header}>
          <span>{label}</span>
          <button type="button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>
        <div className={styles.body}>실시간 스트림 연동 예정 (MVP 자리표시)</div>
      </div>
    </div>
  );
}
