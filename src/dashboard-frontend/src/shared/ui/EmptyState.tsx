import styles from './EmptyState.module.css';

interface EmptyStateProps {
  message: string;
  /** 비어 있는 것이 정상 상태임을 알려주는 보조 문구. */
  hint?: string;
}

/** 목록이 비었을 때의 표시를 통일해, 화면마다 빈 영역이 달라 보이지 않게 한다. */
export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.message}>{message}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
