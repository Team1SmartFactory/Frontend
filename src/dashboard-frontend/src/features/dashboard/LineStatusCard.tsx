import type { Line } from '../../shared/domain/types';
import { toneForLine } from '../../shared/domain/statusTone';
import { Badge, Meter } from '../../shared/ui';
import styles from './LineStatusCard.module.css';

interface LineStatusCardProps {
  line: Line;
  /** 배지를 누르면 이 라인의 상세 패널을 연다. */
  onSelect: (line: Line) => void;
  selected: boolean;
}

const TONE_LABEL: Record<string, string> = {
  critical: '부족',
  accent: '보충 중',
  serious: '주의',
  warning: '관찰',
  good: '정상',
};

/**
 * 라인별 실시간 재고 현황 카드. 상태 색은 항상 텍스트 배지와 함께 표시한다(색만으로 의미 전달 금지).
 *
 * 카드 전체가 누를 수 있는 영역이고, 누르면 우측 상세 패널이 열린다. 예전에는 여기서
 * 곧바로 현황 변경 확인 팝업이 떴는데, 판단 근거(카메라·재고 추이)를 못 본 채 바꿀지
 * 말지부터 묻는 순서였다. 지금은 평면도와 같은 패널을 열어 근거를 먼저 보여주고,
 * 변경은 그 패널 맨 아래 스위치가 맡는다 — 두 탭에서 라인을 다루는 방법이 하나로 모인다.
 *
 * 누르는 영역은 <article>에 onClick을 다는 대신 카드를 덮는 투명 버튼으로 만든다.
 * 카드째로 <button>을 만들면 안에 든 <h3>가 버튼 라벨로 흡수되어 제목으로 읽히지
 * 않고, div에 role만 붙이면 키보드 조작을 직접 구현해야 한다. 실제 버튼을 하나 두면
 * 초점·엔터·스페이스가 전부 공짜로 따라온다.
 */
export function LineStatusCard({ line, onSelect, selected }: LineStatusCardProps) {
  const tone = toneForLine(line);
  const needsAction = tone === 'critical';
  const label = TONE_LABEL[tone] ?? '정상';

  return (
    <article className={styles.card} data-tone={tone} data-selected={selected}>
      <header className={styles.header}>
        <h3 className={styles.name}>{line.name}</h3>
        <Badge tone={tone} led pulse={needsAction}>
          {label}
        </Badge>
      </header>

      <div className={styles.readout}>
        <span className={styles.value}>{line.currentQty.toFixed(0)}</span>
        <span className={styles.unit}>%</span>
      </div>

      <Meter
        value={line.currentQty}
        threshold={line.threshold}
        tone={tone}
        label={`${line.name} 재고 면적 비율`}
      />

      <p className={styles.caption}>
        임계치 {line.threshold}% · 부품 적재 면적 기준
      </p>

      <button
        type="button"
        className={styles.hitArea}
        onClick={() => onSelect(line)}
        aria-pressed={selected}
        aria-label={`${line.name} 현황 ${label} — 눌러서 상세 보기`}
      />
    </article>
  );
}
