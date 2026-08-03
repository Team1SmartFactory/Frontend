import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  /** 이 화면에서 무엇을 판단해야 하는지 한 줄로 알려준다. */
  description?: string;
  /** 우측 액션 슬롯 (필터, 요약 뱃지 등) */
  actions?: ReactNode;
}

/** 모든 탭 상단의 제목 영역. 탭 간 시작 높이와 여백을 맞추는 역할을 한다. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
