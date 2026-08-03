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

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 5 8 12l7 7" />
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
