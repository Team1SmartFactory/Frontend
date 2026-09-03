import type { Kpi } from '../../shared/domain/schemas';
import { useKpi } from '../../shared/query/useKpi';
import { Badge, Card, StatusLed } from '../../shared/ui';
import type { Tone } from '../../shared/ui/tone';
import { formatDuration } from '../../shared/utils/formatTime';
import styles from './KpiCard.module.css';

/**
 * 운영 지표 카드 (이슈 #48) — 시스템이 스스로를 숫자로 증명하는 자리.
 *
 * "부족 감지부터 보충 완료까지 얼마나 걸리는가"가 이 시스템이 푸는 산업
 * 문제(결품에 의한 라인 정지)의 답이므로, 전체 리드타임을 맨 앞에 둔다.
 * 표본이 없는 평균은 0이 아니라 "—"다 — 0은 '0초 만에 보충'이라는 거짓말이 된다.
 */

interface Stat {
  key: string;
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone: Tone;
}

function durationStat(key: string, label: string, seconds: number | null, caption: string): Stat {
  return {
    key,
    label,
    value: seconds !== null ? formatDuration(seconds) : '—',
    caption: seconds !== null ? caption : '아직 완료된 보충이 없습니다',
    tone: 'idle',
  };
}

function buildStats(kpi: Kpi): Stat[] {
  const successRate = kpi.successRate;
  return [
    durationStat('lead', '평균 전체 리드타임', kpi.avgLeadTimeSec, '부족 감지 → 보충 완료'),
    durationStat('approval', '평균 승인 대기', kpi.avgApprovalWaitSec, '부족 감지 → 관리자 승인'),
    durationStat('execution', '평균 보충 실행', kpi.avgExecutionSec, '승인 → 로봇 보충 완료'),
    {
      key: 'success',
      label: '보충 성공률',
      value: successRate !== null ? (successRate * 100).toFixed(0) : '—',
      unit: successRate !== null ? '%' : undefined,
      caption:
        successRate !== null
          ? `완료 ${kpi.completed} · 실패 ${kpi.failed}`
          : '아직 실행된 보충이 없습니다',
      tone: successRate === null ? 'idle' : successRate >= 0.9 ? 'good' : 'warning',
    },
  ];
}

export function KpiCard() {
  const { kpi, isPending, isError } = useKpi();

  return (
    <Card
      title="운영 지표"
      subtitle="감지부터 보충 완료까지 — 실제 주행 이력의 자동 집계"
      action={
        kpi ? (
          <Badge tone="idle">
            총 감지 {kpi.totalDetected}건 · 반려 {kpi.humanRejected}건
          </Badge>
        ) : undefined
      }
    >
      {isError ? (
        <p className={styles.placeholder}>지표를 불러오지 못했습니다.</p>
      ) : isPending || !kpi ? (
        <p className={styles.placeholder}>지표를 계산하는 중…</p>
      ) : (
        <ul className={styles.strip}>
          {buildStats(kpi).map((stat) => (
            <li key={stat.key} className={styles.tile}>
              <div className={styles.labelRow}>
                <StatusLed tone={stat.tone} size="sm" />
                <span className={styles.label}>{stat.label}</span>
              </div>
              <p className={styles.readout}>
                <span className={styles.value}>{stat.value}</span>
                {stat.unit && <span className={styles.unit}>{stat.unit}</span>}
              </p>
              <p className={styles.caption}>{stat.caption}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
