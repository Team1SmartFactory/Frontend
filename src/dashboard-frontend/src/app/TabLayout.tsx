import { NavLink, Outlet } from 'react-router-dom';
import { useFactoryStore } from '../store/useFactoryStore';
import { ShortageApprovalModal } from '../features/shortage-approval/ShortageApprovalModal';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './TabLayout.module.css';

const TABS = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/floorplan', label: '평면도' },
  { to: '/cctv', label: 'CCTV' },
  { to: '/settings', label: '설정' },
];

const STATUS_LABEL: Record<string, string> = {
  connecting: '연결 중',
  open: '연결됨',
  closed: '연결 끊김',
  error: '연결 오류',
};

/**
 * 공통 헤더/탭 네비게이션을 두르는 레이아웃.
 * "부품 부족 발생 시 관리자 승인 팝업(모든 뷰 위에서)" 요구사항에 따라
 * ShortageApprovalModal을 여기서 한 번만 렌더링해 모든 탭 위에 겹쳐 보인다.
 */
export function TabLayout() {
  const connectionStatus = useFactoryStore((state) => state.connectionStatus);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.title}>스마트 팩토리 재고 관제</span>
        <nav className={styles.nav}>
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <span className={styles.status} data-status={connectionStatus}>
          {STATUS_LABEL[connectionStatus] ?? connectionStatus}
        </span>
      </header>

      <main className={styles.main}>
        <ErrorBoundary label="현재 탭">
          <Outlet />
        </ErrorBoundary>
      </main>

      <ShortageApprovalModal />
    </div>
  );
}
