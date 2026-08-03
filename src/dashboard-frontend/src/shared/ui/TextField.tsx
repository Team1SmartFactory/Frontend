import { useId, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** 입력 규칙 안내. 오류 메시지가 아니라 사전 설명용. */
  hint?: string;
}

/** 라벨과 입력을 항상 한 쌍으로 묶어, 라벨 연결이 빠지는 일이 없게 한다. */
export function TextField({ label, hint, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input id={id} className={styles.input} aria-describedby={hintId} {...rest} />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
