import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge, Button, Card, TextField } from '../../shared/ui';
import styles from './AuthPanel.module.css';

/** 설정 탭의 "관리자 회원가입/로그인/로그아웃". MVP 데모용으로 실제 인증 서버와 연동되지 않는다. */
export function AuthPanel() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();
    if (!trimmedUsername || !trimmedDisplayName) return;

    login(trimmedUsername, trimmedDisplayName);
    setUsername('');
    setDisplayName('');
  }

  if (currentUser) {
    return (
      <Card
        title="관리자 계정"
        subtitle="승인 기록에 남을 이름입니다."
        action={
          <Badge tone="good" led>
            로그인됨
          </Badge>
        }
      >
        <div className={styles.session}>
          <div>
            <p className={styles.displayName}>{currentUser.displayName}</p>
            <p className={styles.username}>{currentUser.username}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="관리자 로그인" subtitle="승인 권한을 쓰려면 로그인이 필요합니다.">
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          label="아이디"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
        <TextField
          label="이름"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          required
        />
        <Button type="submit" variant="primary">
          로그인
        </Button>
        <p className={styles.note}>MVP 데모용 로그인이며 실제 인증 서버와 연동되지 않습니다.</p>
      </form>
    </Card>
  );
}
