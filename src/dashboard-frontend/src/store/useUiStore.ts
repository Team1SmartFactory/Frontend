import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface UiState {
  selectedLineId: string | null;
  zoomedCameraId: string | null;
  /** 좌측 네비게이션 접힘 여부. 평면도/CCTV에서 화면을 넓게 쓰기 위한 설정. */
  navCollapsed: boolean;
  /** 화면 표시 모드. 'system'이면 OS 설정을 따라가고, OS 값이 바뀌면 즉시 반영한다. */
  theme: Theme;
  selectLine: (lineId: string | null) => void;
  zoomCamera: (cameraId: string | null) => void;
  toggleNav: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEYS = {
  navCollapsed: 'sfsc.ui.navCollapsed',
  theme: 'sfsc.ui.theme',
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
 * 'system'을 실제 라이트/다크 값으로 풀어낸다.
 * jsdom(테스트 환경)은 matchMedia를 구현하지 않으므로 존재 여부부터 확인한다.
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * 풀어낸 값을 <html data-theme>에 반영한다. tokens.css의 다크 모드 블록은
 * 이 속성 하나만 보고 갈라진다 — 미디어 쿼리를 직접 참조하지 않는다.
 * index.html의 인라인 스크립트가 첫 페인트 전에 같은 로직으로 한 번 먼저
 * 적용해 두므로(FOUC 방지), 여기서는 이후의 설정 변경만 반영하면 된다.
 */
function applyTheme(theme: Theme): void {
  try {
    document.documentElement.dataset.theme = resolveTheme(theme);
  } catch {
    // document 접근이 안 되는 환경(테스트 등)에서는 무시한다.
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
  theme: readJson<Theme>(STORAGE_KEYS.theme, 'system'),

  selectLine: (lineId) => set({ selectedLineId: lineId }),
  zoomCamera: (cameraId) => set({ zoomedCameraId: cameraId }),

  toggleNav: () => {
    const navCollapsed = !get().navCollapsed;
    writeJson(STORAGE_KEYS.navCollapsed, navCollapsed);
    set({ navCollapsed });
  },

  setTheme: (theme) => {
    writeJson(STORAGE_KEYS.theme, theme);
    applyTheme(theme);
    set({ theme });
  },
}));

// 저장된 값을 즉시 반영한다. index.html의 인라인 스크립트가 첫 페인트 전에
// 이미 적용해 두지만, 그 스크립트가 실패하거나(스토리지 접근 차단 등)
// 값이 어긋난 경우를 대비해 스토어 초기화 시점에도 한 번 더 맞춘다.
applyTheme(useUiStore.getState().theme);

// 'system' 모드일 때만 OS 테마 변경을 실시간으로 반영한다.
// 명시적으로 라이트/다크를 고른 상태라면 OS가 바뀌어도 그대로 둔다.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (useUiStore.getState().theme === 'system') {
        applyTheme('system');
      }
    });
  } catch {
    // matchMedia가 부분적으로만 구현된 환경(구형 브라우저 등)에서는 무시한다.
  }
}
