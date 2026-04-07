import { useNavigate } from "react-router-dom";
import { useEntries } from "../entries/useEntries";
import { formatShortDate } from "../../shared/lib/date";
import { Card } from "../../shared/ui/Card";

export function HistoryScreen() {
  const navigate = useNavigate();
  const { entriesList } = useEntries();

  return (
    <div className="space-y-4">
      <div className="px-1 pt-2">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
          Timeline
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
          История
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Все сохранённые дни в обратном порядке.
        </p>
      </div>

      {entriesList.length === 0 ? (
        <Card>
          <p className="text-sm text-stone-500">
            Пока нет записей. Создайте первую запись на экране «Сегодня».
          </p>
        </Card>
      ) : (
        entriesList.map((entry) => (
          <button
            key={entry.date}
            type="button"
            onClick={() => navigate(`/today?date=${entry.date}`)}
            className="block w-full text-left"
          >
            <Card className="transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-stone-900">
                    {formatShortDate(entry.date)}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Настроение {entry.moodScore}/10, сон {entry.sleepHours}ч
                  </p>
                </div>
                <div className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
                  {entry.pains.length
                    ? `${entry.pains.length} бол.`
                    : "без боли"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  Вес {entry.weight ?? "—"}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  Шаги {entry.steps?.toLocaleString("ru-RU") || "—"}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  Еда {entry.meals.length || 0}
                </span>
              </div>
            </Card>
          </button>
        ))
      )}
    </div>
  );
}
