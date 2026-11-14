import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEntries } from "../entries/useEntries";
import { closestMood, maxPainLevel } from "../entries/mood";
import type { EntriesMap, HealthEntry } from "../entries/types";
import {
  addDays,
  capitalize,
  formatDateKey,
  formatDayMonth,
  formatWeekdayLong,
  getMonthLabel,
  getMonthMatrix,
  getTodayKey,
  shiftMonth,
  toDate,
  weekdayIndex,
  weekdayShort,
} from "../../shared/lib/date";
import { cn } from "../../shared/lib/cn";
import { Card } from "../../shared/ui/Card";
import { ListCard, PageHeader, Segmented } from "../../shared/ui/Page";
import { ChevronIcon } from "../../shared/ui/icons";

type View = "list" | "month";
type Filter = "all" | "pain" | "bad" | "sleep";
type ColorMode = "mood" | "pain" | "sleep";

const filters: Array<{ value: Filter; label: string; test: (entry: HealthEntry) => boolean }> = [
  { value: "all", label: "Все дни", test: () => true },
  { value: "pain", label: "С болью", test: (entry) => entry.pains.length > 0 },
  { value: "bad", label: "Плохое настроение", test: (entry) => entry.moodScore <= 4 },
  { value: "sleep", label: "Сон < 6 ч", test: (entry) => entry.sleepHours < 6 },
];

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function pluralDays(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

function pluralEntries(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "запись";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "записи";
  return "записей";
}

function entryDetails(entry: HealthEntry) {
  return [
    `Сон ${formatNumber(entry.sleepHours)} ч`,
    entry.steps ? `${formatNumber(entry.steps)} шагов` : null,
    entry.weight !== null ? `${formatNumber(entry.weight)} кг` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function JournalScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = searchParams.get("view") === "month" ? "month" : "list";
  const { entriesList } = useEntries();
  const today = getTodayKey();
  const monthAgo = addDays(today, -29);
  const recentCount = entriesList.filter((entry) => entry.date >= monthAgo).length;

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${recentCount} ${pluralEntries(recentCount)} за 30 дней`}
        title="Журнал"
      />
      <Segmented
        label="Вид журнала"
        value={view}
        onChange={(next) => setSearchParams(next === "month" ? { view: "month" } : {}, { replace: true })}
        options={[
          { value: "list", label: "Список" },
          { value: "month", label: "Месяц" },
        ]}
      />
      {view === "list" ? <EntriesList /> : <MonthView />}
    </div>
  );
}

function EntriesList() {
  const navigate = useNavigate();
  const { entriesList } = useEntries();
  const [filter, setFilter] = useState<Filter>("all");
  const today = getTodayKey();
  const test = filters.find((item) => item.value === filter)!.test;
  const visible = entriesList.filter(test);

  if (entriesList.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          Пока нет записей. Первая появится, когда вы сохраните день на экране «Сегодня».
        </p>
      </Card>
    );
  }

  // Группируем по месяцам, сохраняя порядок от новых к старым
  const groups: Array<{ key: string; label: string; items: HealthEntry[] }> = [];
  for (const entry of visible) {
    const key = entry.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: capitalize(getMonthLabel(toDate(entry.date))), items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }

  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition",
              filter === item.value
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line bg-wash-soft text-ink-soft",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="px-1 pt-2 text-sm text-muted">Таких дней пока не было.</p>
      ) : null}

      {groups.map((group) => (
        <div key={group.key} className="space-y-2 pt-2">
          <div className="flex justify-between px-1 text-[13px] text-muted">
            <span className="font-semibold">{group.label}</span>
            <span>
              {group.items.length} {pluralEntries(group.items.length)}
            </span>
          </div>
          <ListCard>
            {group.items.flatMap((entry, index) => {
              const rows = [];
              // Пропуски показываем только в полном списке: там они что-то значат
              const newer = group.items[index - 1];
              if (filter === "all" && newer) {
                const gap = Math.round(
                  (toDate(newer.date).getTime() - toDate(entry.date).getTime()) / 86_400_000,
                ) - 1;
                if (gap > 0) {
                  rows.push(
                    <p key={`gap-${entry.date}`} className="py-2 pr-4 pl-[70px] text-[12.5px] text-muted">
                      {gap} {pluralDays(gap)} без записи
                    </p>,
                  );
                }
              }
              const mood = closestMood(entry.moodScore);
              const pains = entry.pains.map((pain) => `${pain.type} · ${pain.level}`).join(", ");
              rows.push(
                <button
                  key={entry.date}
                  type="button"
                  onClick={() => navigate(`/today?date=${entry.date}`)}
                  className="flex w-full items-center gap-3 px-3.5 py-[11px] text-left"
                >
                  <span className="w-[42px] flex-none text-center">
                    <span className={cn("block text-[11px]", entry.date === today ? "font-semibold text-accent-strong" : "text-muted")}>
                      {entry.date === today ? "сегодня" : weekdayShort[weekdayIndex(entry.date)]}
                    </span>
                    <span className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
                      {toDate(entry.date).getDate()}
                    </span>
                  </span>
                  <span
                    aria-label={`Настроение: ${mood.label}`}
                    className="grid size-[34px] flex-none place-items-center rounded-xl bg-wash-soft text-[19px]"
                  >
                    {mood.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[14.5px] font-semibold", pains ? "text-accent-strong" : "text-ink")}>
                      {pains || "Без боли"}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted">{entryDetails(entry)}</span>
                  </span>
                </button>,
              );
              return rows;
            })}
          </ListCard>
        </div>
      ))}
    </div>
  );
}

// Цвета ячеек календаря: от тревожного розового до спокойного шалфея
const palette = {
  strong: { bg: "var(--color-accent-strong)", fg: "#fff" },
  accent: { bg: "var(--color-accent)", fg: "var(--color-ink)" },
  soft: { bg: "var(--color-accent-soft)", fg: "var(--color-ink-soft)" },
  neutral: { bg: "var(--color-canvas-deep)", fg: "var(--color-ink-soft)" },
  sageSoft: { bg: "#d3e1d7", fg: "var(--color-ink-soft)" },
  sage: { bg: "#8fae98", fg: "#fff" },
  empty: { bg: "var(--color-wash)", fg: "var(--color-ink-soft)" },
};

const legends: Record<ColorMode, Array<[keyof typeof palette, string]>> = {
  mood: [["strong", "тяжело"], ["accent", ""], ["neutral", "ровно"], ["sageSoft", ""], ["sage", "легко"]],
  pain: [["empty", "нет"], ["soft", "слабая"], ["accent", "средняя"], ["strong", "сильная"]],
  sleep: [["strong", "< 6 ч"], ["accent", "6–7"], ["sageSoft", "7–8"], ["sage", "8+ ч"]],
};

function cellColor(entry: HealthEntry, mode: ColorMode) {
  if (mode === "mood") {
    const score = entry.moodScore;
    if (score <= 3) return palette.strong;
    if (score <= 5) return palette.accent;
    if (score <= 6) return palette.neutral;
    if (score <= 8) return palette.sageSoft;
    return palette.sage;
  }
  if (mode === "pain") {
    const level = maxPainLevel(entry.pains);
    if (!level) return palette.empty;
    if (level <= 3) return palette.soft;
    if (level <= 6) return palette.accent;
    return palette.strong;
  }
  if (entry.sleepHours < 6) return palette.strong;
  if (entry.sleepHours < 7) return palette.accent;
  if (entry.sleepHours < 8) return palette.sageSoft;
  return palette.sage;
}

const weekdayHeads = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

function MonthView() {
  const navigate = useNavigate();
  const { entriesMap } = useEntries();
  const today = getTodayKey();
  const [month, setMonth] = useState(() => toDate(today));
  const [mode, setMode] = useState<ColorMode>("mood");
  const [selected, setSelected] = useState(today);
  const cells = getMonthMatrix(month);
  const isCurrentMonth = formatDateKey(month).slice(0, 7) >= today.slice(0, 7);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1 pt-1">
        <MonthButton label="Предыдущий месяц" flip onClick={() => setMonth((current) => shiftMonth(current, -1))} />
        <p className="text-[17px] font-semibold text-ink">{capitalize(getMonthLabel(month))}</p>
        <MonthButton
          label="Следующий месяц"
          disabled={isCurrentMonth}
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
        />
      </div>

      <Segmented
        label="Чем раскрасить дни"
        value={mode}
        onChange={setMode}
        options={[
          { value: "mood", label: "Настроение" },
          { value: "pain", label: "Боль" },
          { value: "sleep", label: "Сон" },
        ]}
      />

      <Card className="p-3">
        <div className="grid grid-cols-7 gap-[5px] pb-1.5 text-center text-[11px] text-muted">
          {weekdayHeads.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[5px]">
          {cells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />;
            const key = formatDateKey(date);
            const entry = entriesMap[key];
            const future = key > today;
            const color = entry ? cellColor(entry, mode) : null;
            return (
              <button
                key={key}
                type="button"
                disabled={future}
                aria-pressed={key === selected}
                aria-label={`${formatDayMonth(key)}${entry ? "" : ", нет записи"}`}
                onClick={() => setSelected(key)}
                style={color ? { background: color.bg, color: color.fg } : undefined}
                className={cn(
                  "aspect-square rounded-xl text-sm font-medium transition disabled:opacity-35",
                  !color && "bg-wash-soft text-muted",
                  key === today && "shadow-[inset_0_0_0_2px_var(--color-ink)]",
                  key === selected && "outline-2 outline-offset-1 outline-accent-strong",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 text-[11.5px] text-muted">
          {legends[mode].map(([color, label], index) => (
            <span key={index} className="flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-4 rounded-[3px]" style={{ background: palette[color].bg }} />
              {label}
            </span>
          ))}
        </div>
      </Card>

      <DaySummary
        date={selected}
        entriesMap={entriesMap}
        onOpen={() => navigate(`/today?date=${selected}`)}
      />
    </div>
  );
}

function DaySummary({
  date,
  entriesMap,
  onOpen,
}: {
  date: string;
  entriesMap: EntriesMap;
  onOpen: () => void;
}) {
  const entry = entriesMap[date];
  const title = `${capitalize(formatWeekdayLong(date))}, ${formatDayMonth(date)}`;
  const mood = entry ? closestMood(entry.moodScore) : null;

  return (
    <Card className="px-4 py-3.5">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="text-[13px] text-muted">
        {entry && mood ? `${mood.emoji} настроение ${entry.moodScore} из 10` : "Записи нет"}
      </p>
      {entry ? (
        <dl className="my-3 grid grid-cols-2 gap-1.5">
          <SummaryItem label="Сон" value={`${formatNumber(entry.sleepHours)} ч`} />
          <SummaryItem
            label="Боль"
            value={entry.pains.length ? entry.pains.map((pain) => `${pain.type} · ${pain.level}`).join(", ") : "нет"}
          />
          <SummaryItem label="Шаги" value={entry.steps ? formatNumber(entry.steps) : "—"} />
          <SummaryItem label="Вес" value={entry.weight !== null ? `${formatNumber(entry.weight)} кг` : "—"} />
        </dl>
      ) : (
        <div className="h-3" />
      )}
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-[14px] bg-ink py-2.5 text-sm font-semibold text-white"
      >
        {entry ? "Открыть запись" : "Заполнить день"}
      </button>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-wash-soft px-2.5 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="truncate text-[15px] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function MonthButton({
  label,
  onClick,
  disabled,
  flip,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  flip?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-line bg-surface text-ink-soft disabled:opacity-35"
    >
      <ChevronIcon width={16} height={16} className={flip ? "rotate-180" : undefined} />
    </button>
  );
}
