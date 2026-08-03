import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  count: number;
}

/** "부품 부족 발생 시 알람 → 승인 → 로봇 동작" 흐름의 알람 단계. */
export function AlertBanner({ count }: AlertBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      부품 부족 승인 대기 {count}건이 있습니다. 상단 팝업에서 확인해주세요.
    </div>
  );
}
