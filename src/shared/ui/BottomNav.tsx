import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'

const tabs = [
  { to: '/today', label: 'Сегодня', icon: '◐' },
  { to: '/history', label: 'История', icon: '◫' },
  { to: '/calendar', label: 'Календарь', icon: '◭' },
  { to: '/stats', label: 'Статистика', icon: '◒' },
  { to: '/settings', label: 'Ещё', icon: '◎' },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-20 mx-auto w-[calc(100%-24px)] max-w-[428px] rounded-[28px] border border-white/80 bg-white/90 p-2 shadow-[0_20px_60px_rgba(92,80,65,0.16)] backdrop-blur-xl">
      <ul className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center rounded-3xl px-2 py-2 text-[11px] font-medium tracking-[0.02em] transition',
                  isActive
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:bg-stone-100',
                )
              }
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
