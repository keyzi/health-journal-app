import { useState, type ReactNode } from "react";
import { useEntries } from "../entries/useEntries";
import type { EntriesMap, HealthEntry } from "../entries/types";
import {
  addDays,
  formatShortDate,
  getTodayKey,
  weekdayIndex,
  weekdayShort,
} from "../../shared/lib/date";
import { cn } from "../../shared/lib/cn";
import { Card } from "../../shared/ui/Card";
import { ListCard, PageHeader, SectionLabel, Segmented } from "../../shared/ui/Page";

type Period = "7" | "30" | "90";

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fmt(value: number, digits = 1) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function daysRange(end: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDays(end, index - count + 1));
}

function pick(days: string[], map: EntriesMap) {
  return days.map((date) => map[date]).filter((entry): entry is HealthEntry => Boolean(entry));
}

function pluralEntries(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "запись";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "записи";
  return "записей";
}

const weekdayLong = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
const weekdayAccusative = ["понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье"];

type Tone = "good" | "bad" | "flat";

// Изменение к прошлому периоду. higherIsBetter = null — без оценки.
function delta(
  current: number | null,
  previous: number | null,
  higherIsBetter: boolean | null,
  unit = "",
): { text: string; tone: Tone } | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.2) return { text: "как раньше", tone: "flat" };
  const tone: Tone = higherIsBetter === null ? "flat" : diff > 0 === higherIsBetter ? "good" : "bad";
  return { text: `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff))}${unit} к прошлому периоду`, tone };
}

export function StatsScreen() {
  const { entriesMap, settings } = useEntries();
  const [period, setPeriod] = useState<Period>("7");
  const length = Number(period);
  const today = getTodayKey();
  const days = daysRange(today, length);
  const previousDays = daysRange(addDays(today, -length), length);
  const current = pick(days, entriesMap);
  const previous = pick(previousDays, entriesMap);

  const moodAvg = average(current.map((entry) => entry.moodScore));
  const sleepAvg = average(current.map((entry) => entry.sleepHours));
  const steps = current.flatMap((entry) => (entry.steps ? [entry.steps] : []));
  const stepsAvg = average(steps);
  const weights = current.flatMap((entry) => (entry.weight !== null ? [entry.weight] : []));
  const produceAvg = average(current.map((entry) => entry.produceServings));
  const kgAvg = average(current.map((entry) => entry.kgScore));
  const stAvg = average(current.map((entry) => entry.stScore));
  const painDays = current.filter((entry) => entry.pains.length > 0);

  const painByType = new Map<string, number[]>();
  for (const entry of painDays) {
    for (const pain of entry.pains) {
      painByType.set(pain.type, [...(painByType.get(pain.type) || []), pain.level]);
    }
  }
  const painRows = [...painByType.entries()].sort((a, b) => b[1].length - a[1].length);
  const maxPainCount = Math.max(1, ...painRows.map(([, levels]) => levels.length));

  const axisLabels: Array<[number, string]> =
    length === 7
      ? days.map((date, index) => [index, weekdayShort[weekdayIndex(date)]])
      : [
          [0, formatShortDate(days[0])],
          [days.length - 1, formatShortDate(days[days.length - 1])],
        ];

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${formatShortDate(days[0])} – ${formatShortDate(today)} · ${current.length} ${pluralEntries(current.length)}`}
        title="Статистика"
      />
      <Segmented
        label="Период"
        value={period}
        onChange={setPeriod}
        options={[
          { value: "7", label: "7 дней" },
          { value: "30", label: "30 дней" },
          { value: "90", label: "3 месяца" },
        ]}
      />

      {current.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">За этот период записей нет.</p>
        </Card>
      ) : (
        <>
          <SectionLabel>Наблюдения</SectionLabel>
          <Insights current={current} length={length} />

          <SectionLabel>Показатели</SectionLabel>
          <Metric
            label="Настроение"
            value={moodAvg !== null ? fmt(moodAvg) : "—"}
            unit="из 10"
            change={delta(moodAvg, average(previous.map((entry) => entry.moodScore)), true)}
          >
            <Chart
              days={days}
              entriesMap={entriesMap}
              axisLabels={axisLabels}
              kind="line"
              value={(entry) => entry.moodScore}
              label="Настроение по дням, шкала от 0 до 10"
            />
          </Metric>
          <Metric
            label="Сон"
            value={sleepAvg !== null ? fmt(sleepAvg) : "—"}
            unit="ч в среднем"
            change={delta(sleepAvg, average(previous.map((entry) => entry.sleepHours)), true, " ч")}
          >
            <Chart
              days={days}
              entriesMap={entriesMap}
              axisLabels={axisLabels}
              kind="bars"
              goal={8}
              value={(entry) => entry.sleepHours}
              label="Часы сна по дням, цель 8 часов"
            />
          </Metric>

          <div className="grid grid-cols-2 gap-2.5">
            <Metric
              compact
              label="Вес"
              value={weights.length ? fmt(weights[weights.length - 1]) : "—"}
              unit="кг"
              change={
                weights.length > 1
                  ? {
                      text: `${weights[weights.length - 1] - weights[0] > 0 ? "+" : "−"}${fmt(Math.abs(weights[weights.length - 1] - weights[0]))} за период`,
                      tone: "flat",
                    }
                  : { text: "мало замеров", tone: "flat" }
              }
            />
            <Metric
              compact
              label="Шаги"
              value={stepsAvg !== null ? Math.round(stepsAvg).toLocaleString("ru-RU") : "—"}
              change={{ text: "в день, в среднем", tone: "flat" }}
            />
          </div>

          <Metric
            label="Боли"
            value={String(painDays.length)}
            unit={`дн. из ${length}`}
            change={delta(
              painDays.length,
              previous.filter((entry) => entry.pains.length > 0).length,
              false,
            )}
          >
            {painRows.length ? (
              <div className="space-y-2">
                {painRows.map(([type, levels]) => (
                  <div key={type} className="grid grid-cols-[76px_1fr_auto] items-center gap-2 text-[13px] text-ink-soft">
                    <span className="truncate">{type}</span>
                    <i
                      className="block h-2.5 rounded-full bg-accent"
                      style={{ width: `${(levels.length / maxPainCount) * 100}%` }}
                    />
                    <span className="text-xs text-muted">
                      {levels.length}× · ср. {fmt(average(levels)!)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Болей не было.</p>
            )}
          </Metric>

          <div className="grid grid-cols-2 gap-2.5">
            <Metric
              compact
              label={settings.scaleNames.kg}
              value={kgAvg !== null ? fmt(kgAvg) : "—"}
              change={delta(kgAvg, average(previous.map((entry) => entry.kgScore)), null)}
            />
            <Metric
              compact
              label={settings.scaleNames.st}
              value={stAvg !== null ? fmt(stAvg) : "—"}
              change={delta(stAvg, average(previous.map((entry) => entry.stScore)), false)}
            />
          </div>
          <Metric
            compact
            label="Овощи и фрукты"
            value={produceAvg !== null ? fmt(produceAvg) : "—"}
            unit="порций в день"
            change={delta(produceAvg, average(previous.map((entry) => entry.produceServings)), true)}
          />
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  change,
  compact,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  change?: { text: string; tone: Tone } | null;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className={cn("flex gap-2", compact ? "flex-col" : "items-start justify-between")}>
        <div>
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <p className={cn("font-bold tracking-[-0.03em] text-ink", compact ? "text-[22px]" : "text-[26px]")}>
            {value}
            {unit ? <span className="ml-1 text-sm font-medium tracking-normal text-muted">{unit}</span> : null}
          </p>
        </div>
        {change ? (
          <span
            className={cn(
              "self-start rounded-full px-2 py-[3px] text-xs font-semibold",
              change.tone === "good" && "bg-sage-soft text-sage",
              change.tone === "bad" && "bg-accent-soft text-accent-strong",
              change.tone === "flat" && "bg-wash text-muted",
            )}
          >
            {change.text}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}

// Шкала 0–10 фиксирована: небольшие колебания не выглядят обвалом.
// Пропущенный день — пустое место, линия в нём разрывается.
function Chart({
  days,
  entriesMap,
  axisLabels,
  kind,
  value,
  goal,
  label,
}: {
  days: string[];
  entriesMap: EntriesMap;
  axisLabels: Array<[number, string]>;
  kind: "line" | "bars";
  value: (entry: HealthEntry) => number;
  goal?: number;
  label: string;
}) {
  const W = 320;
  const H = 120;
  const left = 18;
  const bottom = 18;
  const top = 6;
  const x = (index: number) => left + ((index + 0.5) * (W - left)) / days.length;
  const y = (v: number) => top + (1 - Math.min(Math.max(v, 0), 10) / 10) * (H - top - bottom);
  const points = days.map((date) => entriesMap[date]);

  const segments: string[][] = [];
  let segment: string[] = [];
  points.forEach((entry, index) => {
    if (!entry) {
      if (segment.length) segments.push(segment);
      segment = [];
      return;
    }
    segment.push(`${x(index)},${y(value(entry))}`);
  });
  if (segment.length) segments.push(segment);

  const barWidth = Math.max(1.5, (W - left) / days.length - (days.length <= 7 ? 14 : days.length <= 30 ? 3 : 1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {[0, 5, 10].map((tick) => (
        <g key={tick}>
          <line x1={left} x2={W} y1={y(tick)} y2={y(tick)} stroke="var(--color-wash)" />
          <text x={0} y={y(tick) + 3} fontSize="9" fill="var(--color-muted)">
            {tick}
          </text>
        </g>
      ))}
      {kind === "line"
        ? segments.map((points, index) =>
            points.length > 1 ? (
              <polyline
                key={index}
                points={points.join(" ")}
                fill="none"
                stroke="var(--color-accent-strong)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null,
          )
        : null}
      {points.map((entry, index) => {
        if (!entry) return null;
        const v = value(entry);
        if (kind === "line") {
          return days.length <= 30 ? (
            <circle key={index} cx={x(index)} cy={y(v)} r={days.length <= 7 ? 3 : 1.8} fill="var(--color-accent-strong)" />
          ) : null;
        }
        return (
          <rect
            key={index}
            x={x(index) - barWidth / 2}
            y={y(v)}
            width={barWidth}
            height={y(0) - y(v)}
            rx={Math.min(4, barWidth / 2)}
            fill={goal !== undefined && v < goal - 2 ? "var(--color-accent)" : "var(--color-accent-strong)"}
          />
        );
      })}
      {goal !== undefined ? (
        <g>
          <line x1={left} x2={W} y1={y(goal)} y2={y(goal)} stroke="var(--color-sage)" strokeDasharray="4 3" strokeWidth="1.2" />
          <text x={W} y={y(goal) - 3} fontSize="9" textAnchor="end" fill="var(--color-sage)">
            цель
          </text>
        </g>
      ) : null}
      {axisLabels.map(([index, text]) => (
        <text
          key={index}
          x={x(index)}
          y={H - 4}
          fontSize="9"
          fill="var(--color-muted)"
          textAnchor={axisLabels.length > 2 ? "middle" : index === 0 ? "start" : "end"}
        >
          {text}
        </text>
      ))}
    </svg>
  );
}

type Insight = { icon: string; text: ReactNode; note: string };

// Простые сравнения средних. Показываем, только когда в каждой группе хватает дней.
function Insights({ current, length }: { current: HealthEntry[]; length: number }) {
  const insights: Insight[] = [];
  const MIN = 3;

  const longSleep = current.filter((entry) => entry.sleepHours >= 7.5);
  const shortSleep = current.filter((entry) => entry.sleepHours < 6.5);
  if (longSleep.length >= MIN && shortSleep.length >= MIN) {
    const diff =
      average(longSleep.map((entry) => entry.moodScore))! -
      average(shortSleep.map((entry) => entry.moodScore))!;
    if (Math.abs(diff) >= 0.5) {
      insights.push({
        icon: "🌙",
        text: (
          <>
            После сна <b>7,5 ч и больше</b> настроение в среднем{" "}
            <b>
              на {fmt(Math.abs(diff))} {diff > 0 ? "выше" : "ниже"}
            </b>
            , чем после сна меньше 6,5 ч.
          </>
        ),
        note: `${longSleep.length} и ${shortSleep.length} дн.`,
      });
    }
  }

  const typeCounts = new Map<string, HealthEntry[]>();
  for (const entry of current) {
    for (const pain of entry.pains) typeCounts.set(pain.type, [...(typeCounts.get(pain.type) || []), entry]);
  }
  const [topType, topEntries] = [...typeCounts.entries()].sort((a, b) => b[1].length - a[1].length)[0] || [];
  if (topType && topEntries.length >= MIN) {
    const sleepOnPain = average(topEntries.map((entry) => entry.sleepHours))!;
    const sleepAll = average(current.map((entry) => entry.sleepHours))!;
    if (Math.abs(sleepOnPain - sleepAll) >= 0.5) {
      insights.push({
        icon: "⚡",
        text: (
          <>
            Чаще всего отмечена боль «{topType}»: <b>{topEntries.length} дн.</b> В эти дни сон — <b>{fmt(sleepOnPain)} ч</b> против{" "}
            {fmt(sleepAll)} ч в среднем.
          </>
        ),
        note: "может быть совпадением",
      });
    }
  }

  const richProduce = current.filter((entry) => entry.produceServings >= 5);
  const poorProduce = current.filter((entry) => entry.produceServings <= 2);
  if (richProduce.length >= MIN && poorProduce.length >= MIN) {
    const diff =
      average(richProduce.map((entry) => entry.moodScore))! -
      average(poorProduce.map((entry) => entry.moodScore))!;
    if (Math.abs(diff) >= 0.5) {
      insights.push({
        icon: "🥦",
        text: (
          <>
            В дни с <b>5+ порциями</b> овощей и фруктов настроение{" "}
            <b>
              на {fmt(Math.abs(diff))} {diff > 0 ? "выше" : "ниже"}
            </b>
            , чем в дни с 1–2.
          </>
        ),
        note: `${richProduce.length} и ${poorProduce.length} дн.`,
      });
    }
  }

  if (length >= 30) {
    const byWeekday = Array.from({ length: 7 }, (_, index) =>
      current.filter((entry) => weekdayIndex(entry.date) === index),
    );
    if (byWeekday.every((group) => group.length >= 2)) {
      const ranked = byWeekday
        .map((group, index) => [index, average(group.map((entry) => entry.moodScore))!] as const)
        .sort((a, b) => b[1] - a[1]);
      if (ranked[0][1] - ranked[6][1] >= 1) {
        insights.push({
          icon: "📅",
          text: (
            <>
              Лучший день недели — <b>{weekdayLong[ranked[0][0]]}</b>, самый тяжёлый — {weekdayAccusative[ranked[6][0]]}.
            </>
          ),
          note: "по среднему настроению",
        });
      }
    }
  }

  if (!insights.length) {
    return (
      <Card className="px-4 py-3.5">
        <p className="text-[13.5px] text-muted">
          Пока нечего сказать уверенно. Наблюдения появятся, когда наберётся больше записей с разными значениями.
        </p>
      </Card>
    );
  }

  return (
    <ListCard>
      {insights.map((insight, index) => (
        <div key={index} className="flex items-start gap-3 px-4 py-3.5">
          <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-[10px] bg-accent-tint text-[15px]">
            {insight.icon}
          </span>
          <div>
            <p className="text-[13.5px] leading-snug text-ink-soft [&_b]:text-ink">{insight.text}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">{insight.note}</p>
          </div>
        </div>
      ))}
      <p className="px-4 py-2.5 text-[11.5px] text-muted">Это совпадения в ваших записях, а не причины.</p>
    </ListCard>
  );
}
