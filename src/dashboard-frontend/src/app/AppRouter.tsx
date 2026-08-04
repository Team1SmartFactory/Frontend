import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TabLayout } from './TabLayout';
import { SplashScreen } from '../features/splash/SplashScreen';
import { DashboardTab } from '../features/dashboard/DashboardTab';
import { FloorPlanTab } from '../features/floorplan/FloorPlanTab';
import { CctvTab } from '../features/cctv/CctvTab';
import { SettingsTab } from '../features/settings/SettingsTab';

/**
 * HashRouter를 사용해 정적 호스팅(예: 사내 웹서버, S3 등) 시
 * 서버 측 리라이트 설정 없이도 새로고침/딥링크가 항상 동작하게 한다.
 */
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route element={<TabLayout />}>
          <Route path="/dashboard" element={<DashboardTab />} />
          <Route path="/floorplan" element={<FloorPlanTab />} />
          <Route path="/cctv" element={<CctvTab />} />
          <Route path="/settings" element={<SettingsTab />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}
