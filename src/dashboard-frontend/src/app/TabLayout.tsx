import { Outlet } from 'react-router-dom';
import { ShortageApprovalModal } from '../features/shortage-approval/ShortageApprovalModal';
import { ErrorBoundary } from './ErrorBoundary';
import { SideNav } from './SideNav';
import styles from './TabLayout.module.css';

/**
 * 좌측 네비게이션 + 본문 레이아웃.
 * "부품 부족 발생 시 관리자 승인 팝업(모든 뷰 위에서)" 요구사항에 따라
 * ShortageApprovalModal을 여기서 한 번만 렌더링해 모든 탭 위에 겹쳐 보인다.
 */
export function TabLayout() {
  return (
    <div className={styles.shell}>
      <SideNav />

      <main className={styles.main}>
        <ErrorBoundary label="현재 탭">
          <Outlet />
        </ErrorBoundary>
      </main>

      <ShortageApprovalModal />
    </div>
  );
}
