import { useEntries } from "../entries/useEntries";
import { Card } from "../../shared/ui/Card";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function LineChart({ values }: { values: number[] }) {
  if (!values.length) {
    return (
      <p className="text-sm text-stone-400">Недостаточно данных для графика.</p>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / range) * 70 - 15;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-full overflow-visible">
      <polyline
        fill="none"
        stroke="#405c4f"
        strokeWidth="2.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarChart({ values }: { values: number[] }) {
  if (!values.length) {
    return (
      <p className="text-sm text-stone-400">Недостаточно данных для графика.</p>
    );
  }

  const max = Math.max(...values) || 1;

  return (
    <div className="flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex-1 rounded-t-2xl bg-emerald-900/12">
          <div
            className="w-full rounded-t-2xl bg-emerald-900"
            style={{ height: `${Math.max((value / max) * 100, 12)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function StatsScreen() {
  const { entriesList } = useEntries();
  const recent = [...entriesList].reverse().slice(-7);
  const moodValues = recent.map((entry) => entry.moodScore);
  const sleepValues = recent.map((entry) => entry.sleepHours);
  const weightValues = entriesList
    .map((entry) => entry.weight)
    .filter((value): value is number => value !== null);

  return (
    <div className="space-y-4">
      <div className="px-1 pt-2">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
          Статистика
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-sm text-stone-400">Средний вес</p>
          <p className="mt-3 text-3xl font-semibold text-stone-900">
            {weightValues.length ? average(weightValues).toFixed(1) : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-400">Средний сон</p>
          <p className="mt-3 text-3xl font-semibold text-stone-900">
            {entriesList.length
              ? average(entriesList.map((entry) => entry.sleepHours)).toFixed(1)
              : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-400">Среднее настроение</p>
          <p className="mt-3 text-3xl font-semibold text-stone-900">
            {entriesList.length
              ? average(entriesList.map((entry) => entry.moodScore)).toFixed(1)
              : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-stone-400">Дней с болью</p>
          <p className="mt-3 text-3xl font-semibold text-stone-900">
            {entriesList.filter((entry) => entry.pains.length > 0).length}
          </p>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-medium text-stone-700">
          Настроение за 7 дней
        </p>
        <div className="mt-4">
          <LineChart values={moodValues} />
        </div>
      </Card>

      <Card>
        <p className="text-sm font-medium text-stone-700">Сон за 7 дней</p>
        <div className="mt-4">
          <BarChart values={sleepValues} />
        </div>
      </Card>
    </div>
  );
}
