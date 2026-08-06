import { PageHeader } from '../../shared/ui';
import { AppearanceSettings } from './AppearanceSettings';
import { PermissionSettings } from './PermissionSettings';
import { SettingsGroup } from './SettingsList';
import styles from './SettingsTab.module.css';

/** 설정 탭: 화면 표시 모드와 로봇 제어 승인 권한을 묶음별 목록으로 보여준다. */
export function SettingsTab() {
  return (
    <div className={styles.page}>
      <PageHeader title="설정" description="화면 표시와 로봇 제어 권한을 관리합니다." />

      <div className={styles.scroll}>
        <SettingsGroup title="화면">
          <AppearanceSettings />
        </SettingsGroup>

        <SettingsGroup title="로봇 제어">
          <PermissionSettings />
        </SettingsGroup>
      </div>
    </div>
  );
}
