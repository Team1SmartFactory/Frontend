import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  children: ReactNode;
}

/** 화면 전반의 버튼 형태를 통일한다. type 기본값은 form 오작동을 막기 위해 button. */
export function Button({ variant = 'secondary', size = 'md', className, children, ...rest }: ButtonProps) {
  const classNames = [styles.button, styles[variant], className ?? ''].filter(Boolean).join(' ');

  return (
    <button type="button" className={classNames} data-size={size} {...rest}>
      {children}
    </button>
  );
}
