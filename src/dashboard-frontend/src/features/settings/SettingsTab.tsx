import { PageHeader } from '../../shared/ui';
import { AuthPanel } from './AuthPanel';
import { PermissionSettings } from './PermissionSettings';
import styles from './SettingsTab.module.css';

/** 설정 탭: 로봇 제어 승인 권한 설정 + 관리자 회원가입/로그인/로그아웃. */
export function SettingsTab() {
  return (
    <div className={styles.page}>
      <PageHeader title="설정" description="로봇 제어 권한과 관리자 계정을 관리합니다." />

      <div className={styles.scroll}>
        <div className={styles.columns}>
          <PermissionSettings />
          <AuthPanel />
        </div>
      </div>
    </div>
  );
}
