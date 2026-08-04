import { create } from 'zustand';

interface UiState {
  selectedLineId: string | null;
  zoomedCameraId: string | null;
  /** 좌측 네비게이션 접힘 여부. 평면도/CCTV에서 화면을 넓게 쓰기 위한 설정. */
  navCollapsed: boolean;
  selectLine: (lineId: string | null) => void;
  zoomCamera: (cameraId: string | null) => void;
  toggleNav: () => void;
}

const STORAGE_KEYS = {
  navCollapsed: 'sfsc.ui.navCollapsed',
} as const;

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

/**
 * 순수 클라이언트 상태만 담는다.
 *
 * 서버에서 받아오는 값(라인·로봇·부족 이벤트·승인 권한)은 Query 캐시가 맡는다.
 * 승인 권한이 여기 있었을 때는 관리자마다 설정이 달라지는 문제가 있었다.
 */
export const useUiStore = create<UiState>((set, get) => ({
  selectedLineId: null,
  zoomedCameraId: null,
  navCollapsed: readJson(STORAGE_KEYS.navCollapsed, false),

  selectLine: (lineId) => set({ selectedLineId: lineId }),
  zoomCamera: (cameraId) => set({ zoomedCameraId: cameraId }),

  toggleNav: () => {
    const navCollapsed = !get().navCollapsed;
    writeJson(STORAGE_KEYS.navCollapsed, navCollapsed);
    set({ navCollapsed });
  },
}));
