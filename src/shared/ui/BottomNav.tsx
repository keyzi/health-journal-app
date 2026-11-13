import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import {
  CalendarIcon,
  HistoryIcon,
  MoreIcon,
  StatsIcon,
  TodayIcon,
} from './icons'

const tabs = [
  { to: '/today', label: 'Сегодня', Icon: TodayIcon },
  { to: '/history', label: 'История', Icon: HistoryIcon },
  { to: '/calendar', label: 'Календарь', Icon: CalendarIcon },
  { to: '/stats', label: 'Статистика', Icon: StatsIcon },
  { to: '/settings', label: 'Ещё', Icon: MoreIcon },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-24px)] max-w-[428px] rounded-[28px] border border-surface/80 bg-surface/90 p-2 shadow-nav backdrop-blur-xl">
      <ul className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center rounded-3xl px-2 py-2 text-[11px] font-medium tracking-[0.02em] transition',
                  isActive
                    ? 'bg-accent-strong text-white'
                    : 'text-muted hover:bg-wash',
                )
              }
            >
              <tab.Icon />
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
