import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: ReactNode;
  /** 제목 아래 한 줄 설명. 섹션의 판단 기준을 적어 두는 자리다. */
  subtitle?: ReactNode;
  /** 헤더 우측 슬롯 (개수 뱃지, 필터 버튼 등) */
  action?: ReactNode;
  /** 지도·영상처럼 가장자리까지 채워야 하는 콘텐츠는 'none'. */
  padding?: 'none' | 'md';
  /** 남는 높이를 채우고 본문만 스크롤시킨다. 대시보드 그리드 정렬용. */
  fill?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 모든 화면의 기본 컨테이너.
 * 표면·테두리·모서리·그림자를 한곳에서 정의해 화면마다 카드 모양이 달라지는 것을 막는다.
 */
export function Card({ title, subtitle, action, padding = 'md', fill = false, className, children }: CardProps) {
  const classNames = [styles.card, fill ? styles.fill : '', className ?? ''].filter(Boolean).join(' ');

  return (
    <section className={classNames}>
      {title && (
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={padding === 'none' ? styles.bodyFlush : styles.body}>{children}</div>
    </section>
  );
}
