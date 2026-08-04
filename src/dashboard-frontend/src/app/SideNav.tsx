import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { useFactoryStore } from '../store/useFactoryStore';
import { useUiStore } from '../store/useUiStore';
import { selectPendingApprovals } from '../store/selectors';
import { StatusLed } from '../shared/ui';
import {
  CctvIcon,
  ChevronLeftIcon,
  DashboardIcon,
  FloorPlanIcon,
  SettingsIcon,
} from '../shared/ui/icons';
import type { Tone } from '../shared/ui/tone';
import type { ConnectionStatus } from '../shared/realtime/RealtimeClient';
import styles from './SideNav.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: '대시보드', icon: DashboardIcon },
  { to: '/floorplan', label: '평면도', icon: FloorPlanIcon },
  { to: '/cctv', label: 'CCTV', icon: CctvIcon },
  { to: '/settings', label: '설정', icon: SettingsIcon },
];

const CONNECTION: Record<ConnectionStatus, { label: string; tone: Tone }> = {
  connecting: { label: '연결 중', tone: 'warning' },
  open: { label: '실시간 연결됨', tone: 'good' },
  closed: { label: '연결 끊김', tone: 'critical' },
  error: { label: '연결 오류', tone: 'critical' },
};

/**
 * 좌측 네비게이션. 접으면 아이콘만 남기고 폭을 줄여
 * 평면도·CCTV처럼 넓은 화면이 필요한 탭에서 공간을 양보한다.
 * 접힘 상태는 useUiStore가 localStorage에 보존한다.
 */
export function SideNav() {
  const navCollapsed = useUiStore((state) => state.navCollapsed);
  const toggleNav = useUiStore((state) => state.toggleNav);
  const connectionStatus = useFactoryStore((state) => state.connectionStatus);
  const shortageEvents = useFactoryStore((state) => state.shortageEvents);

  const pendingCount = selectPendingApprovals(shortageEvents).length;
  const connection = CONNECTION[connectionStatus];

  return (
    <nav
      className={styles.nav}
      data-collapsed={navCollapsed}
      aria-label="주요 화면"
    >
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          SF
        </span>
        <span className={styles.brandText}>
          <strong className={styles.brandTitle}>스마트 팩토리</strong>
          <span className={styles.brandSubtitle}>재고 관제</span>
        </span>
      </div>

      <ul className={styles.list}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
              title={navCollapsed ? label : undefined}
            >
              <span className={styles.linkIcon}>
                <Icon />
              </span>
              <span className={styles.linkLabel}>{label}</span>
              {/* 승인 대기 건수는 어느 탭에 있든 보이도록 네비에 상주시킨다. */}
              {to === '/dashboard' && pendingCount > 0 && (
                <span className={styles.linkBadge} data-tone="critical" aria-label={`승인 대기 ${pendingCount}건`}>
                  {pendingCount}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <div className={styles.connection} title={navCollapsed ? connection.label : undefined}>
          <StatusLed tone={connection.tone} pulse={connectionStatus === 'connecting'} size="sm" />
          <span className={styles.connectionLabel}>{connection.label}</span>
        </div>

        <button
          type="button"
          className={styles.toggle}
          onClick={toggleNav}
          aria-expanded={!navCollapsed}
          aria-label={navCollapsed ? '네비게이션 펼치기' : '네비게이션 접기'}
          title={navCollapsed ? '펼치기' : '접기'}
        >
          <span className={styles.toggleIcon}>
            <ChevronLeftIcon size={1.1} />
          </span>
          <span className={styles.toggleLabel}>접기</span>
        </button>
      </div>
    </nav>
  );
}
