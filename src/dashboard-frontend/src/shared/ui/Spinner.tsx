import styles from './Spinner.module.css';

/**
 * 회전 로딩 인디케이터.
 *
 * 순수 장식이므로 aria-hidden으로 접근성 트리에서 뺀다.
 * "무엇을 기다리는지"는 이 스피너를 감싸는 쪽이 role="status"와 문구로 알린다.
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <span className={styles.spinner} data-size={size} aria-hidden="true" />;
}
