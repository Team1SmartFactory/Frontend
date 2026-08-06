import type { ReactNode } from 'react';
import styles from './SettingsList.module.css';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

/**
 * 설정 항목 묶음.
 *
 * 카드 제목을 상자 안에 넣는 대신 흰 목록 위에 작은 글씨로 얹는다.
 * 상자마다 제목 영역을 두면 항목 두 개짜리 묶음도 화면을 크게 차지하는데,
 * 설정은 훑어보며 찾는 화면이라 항목 자체가 먼저 눈에 들어와야 한다.
 */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <section className={styles.group}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <ul className={styles.list}>{children}</ul>
    </section>
  );
}

interface SettingsRowProps {
  /** 항목 이름. 생략하면 children이 행 전체를 쓴다 (자체 라벨을 가진 Switch·입력폼). */
  label?: string;
  description?: ReactNode;
  /** 이름 오른쪽에 놓을 컨트롤. 스위치처럼 좁은 것만 놓는다. */
  control?: ReactNode;
  /** 이름 아래 전체 폭으로 놓을 컨트롤. 세그먼트·입력폼처럼 넓은 것을 놓는다. */
  children?: ReactNode;
}

/** 목록의 한 줄. 행 사이 경계선은 목록이 그리므로 여기서는 여백만 잡는다. */
export function SettingsRow({ label, description, control, children }: SettingsRowProps) {
  return (
    <li className={styles.row}>
      {label && (
        <div className={styles.main}>
          <div className={styles.text}>
            <p className={styles.label}>{label}</p>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {control && <div className={styles.control}>{control}</div>}
        </div>
      )}
      {children && <div className={styles.extra}>{children}</div>}
    </li>
  );
}
