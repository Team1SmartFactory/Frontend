import { useEffect } from 'react';

/**
 * Esc 키로 오버레이를 닫는다.
 * 모달마다 같은 리스너를 반복 작성하지 않도록 하나로 모아 둔 훅이며,
 * enabled가 false면 리스너를 아예 붙이지 않아 닫힌 모달이 키 입력을 가로채지 않는다.
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onEscape();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
