import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

// Сегодня: солнце над горизонтом
export function TodayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </Icon>
  )
}

// История: часы со стрелкой назад
export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
      <path d="M3.5 4v4.5H8" />
      <path d="M12 8v4.2l2.8 1.8" />
    </Icon>
  )
}

// Календарь
export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <circle cx="8.5" cy="14.5" r=".6" fill="currentColor" />
      <circle cx="12" cy="14.5" r=".6" fill="currentColor" />
      <circle cx="15.5" cy="14.5" r=".6" fill="currentColor" />
    </Icon>
  )
}

// Статистика: столбцы
export function StatsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 19.5v-6.5M12 19.5V5M18.5 19.5v-9.5" strokeWidth="3.4" />
    </Icon>
  )
}

// Ещё: ползунки настроек
export function MoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </Icon>
  )
}
