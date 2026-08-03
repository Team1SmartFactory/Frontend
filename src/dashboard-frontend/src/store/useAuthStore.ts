import { create } from 'zustand';

export interface AdminUser {
  username: string;
  displayName: string;
}

interface AuthState {
  currentUser: AdminUser | null;
  login: (username: string, displayName: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'sfsc.auth.currentUser';

function loadStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

/**
 * MVP 데모용 인증 스토어. 실제 인증 서버와 연동되지 않으며
 * localStorage에 로그인 상태만 보관한다. (설정 탭: 회원가입/로그인/로그아웃)
 */
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: loadStoredUser(),

  login: (username, displayName) => {
    const user: AdminUser = { username, displayName };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // 저장 공간 접근 실패는 무시하고 세션 내 로그인 상태만 유지한다.
    }
    set({ currentUser: user });
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ currentUser: null });
  },
}));
