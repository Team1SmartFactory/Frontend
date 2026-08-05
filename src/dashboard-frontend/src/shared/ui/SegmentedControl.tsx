import type { ComponentType } from 'react';
import styles from './SegmentedControl.module.css';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ size?: number }>;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  'aria-label': string;
}

/**
 * 상호 배타적인 소수 옵션(2~4개) 중 하나를 고르는 컨트롤.
 * 체크박스 스위치로는 표현할 수 없는 "라이트/다크/시스템" 같은 3지선다에 쓴다.
 * radiogroup/radio 역할을 직접 부여해, 스크린 리더가 "N개 중 M번째, 선택됨"으로 읽게 한다.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.track} role="radiogroup" aria-label={ariaLabel}>
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            className={styles.segment}
            data-selected={selected}
            onClick={() => onChange(optionValue)}
          >
            {Icon && (
              <span className={styles.icon}>
                <Icon size={1} />
              </span>
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
