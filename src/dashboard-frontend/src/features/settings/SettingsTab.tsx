import { AuthPanel } from './AuthPanel';
import { PermissionSettings } from './PermissionSettings';
import styles from './SettingsTab.module.css';

/** 설정 탭: 로봇 제어 승인 권한 설정 + 관리자 회원가입/로그인/로그아웃. */
export function SettingsTab() {
  return (
    <div className={styles.page}>
      <PermissionSettings />
      <AuthPanel />
    </div>
  );
}
