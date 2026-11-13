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
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 pb-[max(env(safe-area-inset-bottom),10px)] backdrop-blur-xl">
      <ul className="mx-auto grid max-w-[460px] grid-cols-5 px-2 pt-2">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-[3px] py-1 text-[10.5px] font-medium transition',
                  isActive ? 'text-accent-strong [&>svg]:fill-accent-soft' : 'text-muted',
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
