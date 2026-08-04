import { useId } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** 이 설정을 켜고 끄면 무엇이 달라지는지 한 줄로 설명한다. */
  description?: string;
  /** 저장 요청이 진행 중일 때 연타를 막는다. */
  disabled?: boolean;
}

/**
 * 켬/끔 설정 스위치.
 * 실제 포커스·키보드 동작은 네이티브 checkbox가 담당하고,
 * 보이는 트랙/노브는 그 위에 그린다. (직접 만든 토글의 접근성 함정 회피)
 */
export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;

  return (
    <div className={styles.row} data-disabled={disabled}>
      <div className={styles.text}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
      </div>

      <span className={styles.control}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className={styles.input}
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.knob} />
        </span>
      </span>
    </div>
  );
}
