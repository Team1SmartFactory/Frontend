import { create } from 'zustand';

export interface Permissions {
  approvalRequired: boolean;
  authorizedApprovers: string[];
}

interface UiState {
  selectedLineId: string | null;
  zoomedCameraId: string | null;
  /** 좌측 네비게이션 접힘 여부. 평면도/CCTV에서 화면을 넓게 쓰기 위한 설정. */
  navCollapsed: boolean;
  permissions: Permissions;
  selectLine: (lineId: string | null) => void;
  zoomCamera: (cameraId: string | null) => void;
  toggleNav: () => void;
  setPermissions: (permissions: Permissions) => void;
}

const STORAGE_KEYS = {
  permissions: 'sfsc.settings.permissions',
  navCollapsed: 'sfsc.ui.navCollapsed',
} as const;

const DEFAULT_PERMISSIONS: Permissions = {
  approvalRequired: true,
  authorizedApprovers: ['admin'],
};

/**
 * localStorage 접근을 한 쌍의 헬퍼로 감싼다.
 * 사파리 프라이빗 모드처럼 접근이 막히거나 저장값이 손상된 경우에도
 * 화면이 죽지 않고 기본값으로 동작하게 하려는 목적이다.
 */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 기능 동작에 영향을 주지 않으므로 무시한다.
  }
}

/** 평면도/CCTV 탭의 선택 상태, 네비게이션 접힘, 설정 탭의 승인 권한을 담당한다. */
export const useUiStore = create<UiState>((set, get) => ({
  selectedLineId: null,
  zoomedCameraId: null,
  navCollapsed: readJson(STORAGE_KEYS.navCollapsed, false),
  permissions: { ...DEFAULT_PERMISSIONS, ...readJson<Partial<Permissions>>(STORAGE_KEYS.permissions, {}) },

  selectLine: (lineId) => set({ selectedLineId: lineId }),
  zoomCamera: (cameraId) => set({ zoomedCameraId: cameraId }),

  toggleNav: () => {
    const navCollapsed = !get().navCollapsed;
    writeJson(STORAGE_KEYS.navCollapsed, navCollapsed);
    set({ navCollapsed });
  },

  setPermissions: (permissions) => {
    writeJson(STORAGE_KEYS.permissions, permissions);
    set({ permissions });
  },
}));
