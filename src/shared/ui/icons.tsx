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

// Иконки разделов дневника

export function PillIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
      <path d="M12 8.5v7" />
    </Icon>
  )
}

export function PulseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </Icon>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Icon>
  )
}

export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" />
      <path d="M5 19l7-7" />
    </Icon>
  )
}

export function ForkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3v7a2.5 2.5 0 0 0 2.5 2.5V21M7 3v4M12 3v4.5a2.5 2.5 0 0 1-2.5 2.5M17 3c-1.7 1.6-2.5 4-2.5 7h2.5v11" />
    </Icon>
  )
}

export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M9 9.5a4 4 0 0 1 6 0M12 12l1.5-2.5" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth="3" {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function ChevronIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  )
}

// Журнал: блокнот
export function JournalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5h10a2 2 0 0 1 2 2v15l-3-2-3 2-3-2-3 2V5.5a2 2 0 0 1 2-2z" />
      <path d="M9 8h6M9 12h4" />
    </Icon>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Icon>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20V9M7 13l5-5 5 5M5 4h14" />
    </Icon>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </Icon>
  )
}
