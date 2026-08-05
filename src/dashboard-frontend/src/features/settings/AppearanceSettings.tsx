import { useUiStore, type Theme } from '../../store/useUiStore';
import { Card, SegmentedControl } from '../../shared/ui';
import { MoonIcon, SunIcon, SystemIcon } from '../../shared/ui/icons';
import styles from './AppearanceSettings.module.css';

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: '라이트', icon: SunIcon },
  { value: 'dark', label: '다크', icon: MoonIcon },
  { value: 'system', label: '시스템', icon: SystemIcon },
];

/**
 * 설정 탭의 "화면 표시". 라이트/다크/시스템을 고른다.
 * 저장은 useUiStore가 localStorage에 맡고, 선택 즉시 <html data-theme>에
 * 반영되므로 저장 버튼이나 새로고침이 필요 없다.
 */
export function AppearanceSettings() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <Card title="화면 표시" subtitle="이 기기에서 화면이 밝게 또는 어둡게 보일지 정합니다.">
      <div className={styles.body}>
        <SegmentedControl value={theme} onChange={setTheme} options={THEME_OPTIONS} aria-label="화면 표시 모드" />
        {theme === 'system' && (
          <p className={styles.hint}>기기의 시스템 설정을 따라가며, OS 설정이 바뀌면 자동으로 전환됩니다.</p>
        )}
      </div>
    </Card>
  );
}
