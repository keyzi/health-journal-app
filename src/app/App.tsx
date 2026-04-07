import { Navigate, Route, Routes } from 'react-router-dom'
import { CalendarScreen } from '../features/calendar/CalendarScreen'
import { HistoryScreen } from '../features/history/HistoryScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { StatsScreen } from '../features/stats/StatsScreen'
import { TodayScreen } from '../features/today/TodayScreen'
import { BottomNav } from '../shared/ui/BottomNav'

export function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fbf7f2_0%,#f4efe8_45%,#ede6dd_100%)] text-stone-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-4 pt-5 pb-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(143,170,154,0.22),transparent_62%)]" />
        <main className="relative flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/calendar" element={<CalendarScreen />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
