import { Navigate, Route, Routes } from 'react-router-dom'
import { JournalScreen } from '../features/journal/JournalScreen'
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
            <Route path="/journal" element={<JournalScreen />} />
            {/* Старые адреса: История и Календарь объединены в Журнал */}
            <Route path="/history" element={<Navigate to="/journal" replace />} />
            <Route path="/calendar" element={<Navigate to="/journal?view=month" replace />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/settings/:section" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Backdrop>
  )
}
