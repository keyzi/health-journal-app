import { Navigate, Route, Routes } from 'react-router-dom'
import { CalendarScreen } from '../features/calendar/CalendarScreen'
import { HistoryScreen } from '../features/history/HistoryScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { StatsScreen } from '../features/stats/StatsScreen'
import { TodayScreen } from '../features/today/TodayScreen'
import { Backdrop } from '../shared/ui/Backdrop'
import { BottomNav } from '../shared/ui/BottomNav'

export function App() {
  return (
    <Backdrop>
      <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-4 pt-5 pb-44">
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
    </Backdrop>
  )
}
