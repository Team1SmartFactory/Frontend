import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import styles from './AuthPanel.module.css';

/** 설정 탭의 "관리자 회원가입/로그인/로그아웃". MVP 데모용으로 실제 인증 서버와 연동되지 않는다. */
export function AuthPanel() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (currentUser) {
    return (
      <div className={styles.panel}>
        <p>
          <strong>{currentUser.displayName}</strong>님으로 로그인됨 ({currentUser.username})
        </p>
        <button type="button" onClick={logout}>
          로그아웃
        </button>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();
    if (!trimmedUsername || !trimmedDisplayName) return;

    login(trimmedUsername, trimmedDisplayName);
    setUsername('');
    setDisplayName('');
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <h4>관리자 로그인 / 회원가입</h4>
      <label>
        아이디
        <input value={username} onChange={(event) => setUsername(event.target.value)} required />
      </label>
      <label>
        이름
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
      </label>
      <button type="submit">로그인</button>
      <p className={styles.note}>MVP 데모용 로그인이며 실제 인증 서버와 연동되지 않습니다.</p>
    </form>
  );
}
