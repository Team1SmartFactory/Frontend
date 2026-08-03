import { create } from 'zustand';

export interface Permissions {
  approvalRequired: boolean;
  authorizedApprovers: string[];
}

interface UiState {
  selectedLineId: string | null;
  zoomedCameraId: string | null;
  permissions: Permissions;
  selectLine: (lineId: string | null) => void;
  zoomCamera: (cameraId: string | null) => void;
  setPermissions: (permissions: Permissions) => void;
}

const PERMISSIONS_KEY = 'sfsc.settings.permissions';

const DEFAULT_PERMISSIONS: Permissions = {
  approvalRequired: true,
  authorizedApprovers: ['admin'],
};

function loadPermissions(): Permissions {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (raw) return { ...DEFAULT_PERMISSIONS, ...(JSON.parse(raw) as Partial<Permissions>) };
  } catch {
    // 저장된 값이 손상된 경우 기본값으로 되돌린다.
  }
  return DEFAULT_PERMISSIONS;
}

/** 평면도/CCTV 탭의 선택 상태와 설정 탭의 승인 권한 설정을 담당한다. */
export const useUiStore = create<UiState>((set) => ({
  selectedLineId: null,
  zoomedCameraId: null,
  permissions: loadPermissions(),

  selectLine: (lineId) => set({ selectedLineId: lineId }),
  zoomCamera: (cameraId) => set({ zoomedCameraId: cameraId }),

  setPermissions: (permissions) => {
    try {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    } catch {
      // ignore
    }
    set({ permissions });
  },
}));
