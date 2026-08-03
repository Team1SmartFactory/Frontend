import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactoryStore } from '../../store/useFactoryStore';
import styles from './SplashScreen.module.css';

const FALLBACK_DELAY_MS = 2500;

const STATUS_MESSAGE: Record<string, string> = {
  connecting: '실시간 연결 준비 중…',
  open: '연결 완료. 대시보드로 이동합니다.',
  closed: '연결이 끊겼습니다. 대시보드로 이동합니다.',
  error: '연결에 실패했습니다. 대시보드로 이동합니다.',
};

/**
 * 온보딩 스플래시 뷰. 실시간 연결이 열리면 즉시 대시보드로 넘어가고,
 * 연결이 지연되더라도 FALLBACK_DELAY_MS 후에는 강제로 진입시켜
 * 사용자가 스플래시에 무한정 갇히지 않게 한다.
 */
export function SplashScreen() {
  const connectionStatus = useFactoryStore((state) => state.connectionStatus);
  const navigate = useNavigate();

  useEffect(() => {
    if (connectionStatus === 'open') {
      navigate('/dashboard', { replace: true });
    }
  }, [connectionStatus, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => navigate('/dashboard', { replace: true }), FALLBACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.splash}>
      <span className={styles.mark} aria-hidden="true">
        SF
      </span>
      <h1 className={styles.logo}>Smart Factory Stock Control</h1>
      <p className={styles.subtitle}>Beagle + OMX-F 기반 재고 관제 대시보드</p>

      <p className={styles.status} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        {STATUS_MESSAGE[connectionStatus] ?? '준비 중…'}
      </p>
    </div>
  );
}
