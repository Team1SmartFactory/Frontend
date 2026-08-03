import styles from './CameraTile.module.css';

interface CameraTileProps {
  label: string;
  onZoom: () => void;
}

/** 실제 스트림 대신 자리표시 화면. 클릭 시 확대 팝업이 열린다. */
export function CameraTile({ label, onZoom }: CameraTileProps) {
  return (
    <button type="button" className={styles.tile} onClick={onZoom} aria-label={`${label} 카메라 확대`}>
      <span className={styles.liveDot} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
