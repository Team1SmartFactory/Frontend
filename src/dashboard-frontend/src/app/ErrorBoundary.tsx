import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../shared/ui';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  label: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 탭 단위로 감싸서, 한 탭의 렌더링 오류가 전체 앱을 무너뜨리지 않게 한다.
 * React 클래스 컴포넌트만 렌더 오류를 catch할 수 있어 함수형으로 대체 불가.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className={styles.fallback} role="alert">
          <p>{this.props.label} 화면을 불러오는 중 오류가 발생했습니다.</p>
          <Button variant="secondary" onClick={this.handleRetry}>
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
