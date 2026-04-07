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
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
          Calendar
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
          Календарь
        </h1>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            className="rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-600"
          >
            Назад
          </button>
          <p className="text-sm font-medium capitalize text-stone-700">
            {getMonthLabel(month)}
          </p>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            className="rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-600"
          >
            Вперёд
          </button>
        </div>

        <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs text-stone-400">
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
                    ? "border-emerald-900/10 bg-emerald-50 text-emerald-950"
                    : "border-stone-200 bg-stone-50 text-stone-500"
                } ${isToday ? "ring-2 ring-stone-900/15" : ""}`}
              >
                <span className="flex h-full flex-col items-center justify-center">
                  <span>{date.getDate()}</span>
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      hasEntry ? "bg-emerald-800" : "bg-transparent"
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
