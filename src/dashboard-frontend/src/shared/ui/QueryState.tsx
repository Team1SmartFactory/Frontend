import type { ReactNode } from 'react';
import { ApiError } from '../api/ApiError';
import { Button } from './Button';
import { Spinner } from './Spinner';
import styles from './QueryState.module.css';

/**
 * 데이터를 불러오는 중임을 알린다.
 *
 * 스켈레톤 대신 단순한 문구를 쓰는 이유는, 이 앱의 로딩이 부팅 시 한 번뿐이고
 * 그 뒤로는 WebSocket이 갱신하기 때문이다. 화면 구조를 흉내내는 스켈레톤은
 * 여기서는 과한 장치다.
 */
export function LoadingState({ message = '불러오는 중…' }: { message?: string }) {
  return (
    <div className={styles.state} role="status">
      <Spinner />
      <p className={styles.message}>{message}</p>
    </div>
  );
}

/**
 * 실패 원인을 사용자 언어로 알리고 재시도 수단을 준다.
 *
 * ApiError.kind에 따라 문구를 나누는 이유는, 사용자가 할 수 있는 일이
 * 종류마다 다르기 때문이다. 네트워크 문제는 재시도가 의미 있지만,
 * 계약 불일치는 사용자가 아무것도 할 수 없으므로 관리자에게 알리도록 유도한다.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { message, hint, canRetry } = describe(error);

  return (
    <div className={styles.state} role="alert">
      <p className={styles.message}>{message}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {canRetry && onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}

function describe(error: unknown): { message: string; hint?: string; canRetry: boolean } {
  if (!(error instanceof ApiError)) {
    return { message: '알 수 없는 오류가 발생했습니다.', canRetry: true };
  }

  switch (error.kind) {
    case 'network':
      return {
        message: error.message,
        hint: '백엔드 서버가 실행 중인지 확인해 주세요.',
        canRetry: true,
      };
    case 'server':
      return {
        message: '서버에서 오류가 발생했습니다.',
        hint: `${error.path} (HTTP ${error.status})`,
        canRetry: true,
      };
    case 'client':
      return { message: error.message, hint: `${error.path} (HTTP ${error.status})`, canRetry: false };
    case 'contract':
      return {
        message: error.message,
        hint: '프론트엔드와 백엔드의 API 버전이 어긋났을 수 있습니다.',
        canRetry: false,
      };
  }
}

/**
 * 로딩·에러·정상을 한 자리에서 분기한다.
 * 각 탭이 같은 if 사다리를 반복해 쓰지 않게 하려는 목적이다.
 */
export function QueryState({
  isPending,
  isError,
  error,
  onRetry,
  loadingMessage,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  loadingMessage?: string;
  children: ReactNode;
}) {
  if (isPending) return <LoadingState message={loadingMessage} />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  return <>{children}</>;
}
