import { PageHeader } from '../../shared/ui';
import { AppearanceSettings } from './AppearanceSettings';
import { PermissionSettings } from './PermissionSettings';
import styles from './SettingsTab.module.css';

/** 설정 탭: 화면 표시 모드와 로봇 제어 승인 권한 설정. */
export function SettingsTab() {
  return (
    <div className={styles.page}>
      <PageHeader title="설정" description="화면 표시와 로봇 제어 권한을 관리합니다." />

      <div className={styles.scroll}>
        <AppearanceSettings />
        <PermissionSettings />
      </div>
    </div>
  );
}
