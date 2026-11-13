import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntries } from "../entries/useEntries";
import {
  formatDateKey,
  getMonthLabel,
  getMonthMatrix,
  getTodayKey,
  shiftMonth,
} from "../../shared/lib/date";
import { Card } from "../../shared/ui/Card";

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarScreen() {
  const navigate = useNavigate();
  const { entriesMap } = useEntries();
  const [month, setMonth] = useState(() => new Date());
  const days = getMonthMatrix(month);
  const today = getTodayKey();

  return (
    <div className="space-y-4">
      <div className="px-1 pt-2">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-soft">
          Calendar
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">
          Календарь
        </h1>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            className="rounded-full bg-wash px-3 py-2 text-sm text-ink-soft"
          >
            Назад
          </button>
          <p className="text-sm font-medium capitalize text-ink-soft">
            {getMonthLabel(month)}
          </p>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            className="rounded-full bg-wash px-3 py-2 text-sm text-ink-soft"
          >
            Вперёд
          </button>
        </div>

        <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs text-muted-soft">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateKey = formatDateKey(date);
            const hasEntry = Boolean(entriesMap[dateKey]);
            const isToday = dateKey === today;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => navigate(`/today?date=${dateKey}`)}
                className={`aspect-square rounded-2xl border text-sm transition ${
                  hasEntry
                    ? "border-accent-strong/10 bg-accent-soft text-accent-strong"
                    : "border-line bg-wash-soft text-muted"
                } ${isToday ? "ring-2 ring-accent-strong/25" : ""}`}
              >
                <span className="flex h-full flex-col items-center justify-center">
                  <span>{date.getDate()}</span>
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      hasEntry ? "bg-accent-strong" : "bg-transparent"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
