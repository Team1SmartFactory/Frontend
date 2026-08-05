/**
 * 인라인 SVG 아이콘 세트.
 * 아이콘 라이브러리를 추가하지 않고 currentColor로 테마를 따라가게 해,
 * 번들 크기와 다크모드 대응을 동시에 해결한다.
 * 모두 24x24 그리드 / 1.7 스트로크로 통일해 시각 무게를 맞춘다.
 */
interface IconProps {
  /** em 단위. 부모 글자 크기를 따라간다. */
  size?: number;
}

function Svg({ size = 1.25, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={`${size}em`}
      height={`${size}em`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
    </Svg>
  );
}

export function FloorPlanIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 10h7V3M10 10v11M14 21v-7h7" />
    </Svg>
  );
}

export function CctvIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7.5 17 4l1.5 5.5L4.5 13z" />
      <path d="M6 13v3a2 2 0 0 0 2 2h4" />
      <circle cx="18.5" cy="17.5" r="2.5" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.87-1.2l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 10 4.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.87 1.2l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z" />
    </Svg>
  );
}

/**
 * 사이드바 접기/펼치기 아이콘 — 패널 프레임 안에 세로선 하나로 "사이드바"를
 * 표현하는, Notion을 비롯해 대부분의 에디터형 앱이 쓰는 관용적인 형태다.
 * 상태에 따라 회전·반전하지 않고 항상 같은 모양을 쓴다.
 */
export function SidebarToggleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9 4v16" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6 18 18M18 6 6 18" />
    </Svg>
  );
}

/* ─── 테마 선택 (설정 탭 화면 표시) ────────────────────────────── */

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </Svg>
  );
}

/** 시스템 설정 따라가기 — 모니터 화면 형태로 'OS 값을 그대로 따른다'는 뜻을 전달한다. */
export function SystemIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </Svg>
  );
}
