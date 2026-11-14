import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { cloneEntry, createEmptyEntry } from "../entries/defaults";
import { closestMood, moods } from "../entries/mood";
import type { JournalSettings } from "../settings/journalSettings";
import { useEntries } from "../entries/useEntries";
import type { EntriesMap, HealthEntry } from "../entries/types";
import { addDays, capitalize, getTodayKey, toDate, weekdayShort } from "../../shared/lib/date";
import { cn } from "../../shared/lib/cn";
import {
  Chip,
  ScaleField,
  TextArea,
  TextInput,
} from "../../shared/ui/Controls";
import {
  CheckIcon,
  ChevronIcon,
  ForkIcon,
  LeafIcon,
  MoonIcon,
  PillIcon,
  PulseIcon,
  ScaleIcon,
} from "../../shared/ui/icons";

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const next = Number(value.replace(",", "."));
  return Number.isFinite(next) ? next : null;
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

// Сравниваем черновик с исходным состоянием без служебного updatedAt.
function snapshot(entry: HealthEntry) {
  return JSON.stringify({ ...entry, updatedAt: "" });
}

type SectionId =
  | "mood"
  | "medications"
  | "pain"
  | "sleep"
  | "state"
  | "food"
  | "weight";

const allSections: SectionId[] = [
  "mood",
  "medications",
  "pain",
  "sleep",
  "state",
  "food",
  "weight",
];

function pluralSections(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "раздел";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "раздела";
  return "разделов";
}

export function TodayScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get("date") || getTodayKey();
  const {
    entriesMap,
    getEntry,
    getPreviousEntry,
    duplicateFromPrevious,
    saveEntry,
    settings,
  } = useEntries();
  // Живёт выше редактора, чтобы пережить его перемонтирование после сохранения.
  const [savedAt, setSavedAt] = useState<{ date: string; time: string } | null>(
    null,
  );
  const existingEntry = getEntry(selectedDate);
  const previousEntry = getPreviousEntry(selectedDate);
  const editorKey = `${selectedDate}:${existingEntry?.updatedAt ?? "new"}`;

  return (
    <TodayEditor
      key={editorKey}
      selectedDate={selectedDate}
      entriesMap={entriesMap}
      existingEntry={existingEntry}
      previousEntry={previousEntry}
      duplicateFromPrevious={duplicateFromPrevious}
      saveEntry={saveEntry}
      settings={settings}
      savedAt={savedAt?.date === selectedDate ? savedAt.time : null}
      onSaved={(time) => setSavedAt({ date: selectedDate, time })}
      setSearchDate={(date) => setSearchParams({ date })}
    />
  );
}

type TodayEditorProps = {
  selectedDate: string;
  entriesMap: EntriesMap;
  existingEntry?: HealthEntry;
  previousEntry?: HealthEntry;
  duplicateFromPrevious: (date: string) => HealthEntry | undefined;
  saveEntry: (entry: HealthEntry) => Promise<void>;
  settings: JournalSettings;
  savedAt: string | null;
  onSaved: (time: string) => void;
  setSearchDate: (date: string) => void;
};

function TodayEditor({
  selectedDate,
  entriesMap,
  existingEntry,
  previousEntry,
  duplicateFromPrevious,
  saveEntry,
  settings,
  savedAt,
  onSaved,
  setSearchDate,
}: TodayEditorProps) {
  const [baseline] = useState<HealthEntry>(() =>
    existingEntry ? cloneEntry(existingEntry) : createEmptyEntry(selectedDate),
  );
  const [draft, setDraft] = useState<HealthEntry>(baseline);
  const [touched, setTouched] = useState<Set<SectionId>>(new Set());
  const [open, setOpen] = useState<Set<SectionId>>(new Set());
  const [medicineInput, setMedicineInput] = useState("");
  const [mealInput, setMealInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const dirty = snapshot(draft) !== snapshot(baseline);
  const { kg: kgName, st: stName } = settings.scaleNames;
  // Типы боли из настроек плюс уже отмеченные в этой записи (даже если их убрали из списка)
  const painPool = dedupe([...settings.pains, ...draft.pains.map((pain) => pain.type)]);

  const medicationPool = dedupe([
    ...settings.medications,
    ...(previousEntry?.medications || []),
    ...draft.medications,
  ]);
  const mealPool = dedupe([
    ...settings.meals,
    ...(previousEntry?.meals || []),
    ...draft.meals,
  ]);

  // Раздел считается заполненным, если его трогали сейчас или запись уже сохранена.
  // Значения по умолчанию у новой записи не выдаём за ответы.
  const saved = Boolean(existingEntry);
  const filled: Record<SectionId, boolean> = {
    mood: saved || touched.has("mood"),
    medications: draft.medications.length > 0 || touched.has("medications"),
    pain: saved || touched.has("pain"),
    sleep: saved || touched.has("sleep"),
    state: saved || touched.has("state"),
    food:
      draft.meals.length > 0 ||
      Boolean(draft.lastMealTime) ||
      touched.has("food"),
    weight: draft.weight !== null,
  };
  const filledCount = allSections.filter((id) => filled[id]).length;
  const leftCount = allSections.length - filledCount;

  function update(section: SectionId, patch: Partial<HealthEntry>) {
    setDraft((current) => ({ ...current, ...patch }));
    setTouched((current) => new Set(current).add(section));
  }

  function toggleOpen(section: SectionId) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function toggleListItem(key: "medications" | "meals", value: string) {
    const items = draft[key];
    update(key === "meals" ? "food" : "medications", {
      [key]: items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value],
    });
  }

  function addCustomChip(key: "medications" | "meals", value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    update(key === "meals" ? "food" : "medications", {
      [key]: dedupe([...draft[key], trimmed]),
    });
    if (key === "medications") setMedicineInput("");
    if (key === "meals") setMealInput("");
  }

  function togglePain(type: string) {
    const exists = draft.pains.some((pain) => pain.type === type);
    update("pain", {
      pains: exists
        ? draft.pains.filter((pain) => pain.type !== type)
        : [...draft.pains, { type, level: 4 }],
    });
  }

  function setPainLevel(type: string, level: number) {
    update("pain", {
      pains: draft.pains.map((pain) =>
        pain.type === type ? { ...pain, level } : pain,
      ),
    });
  }

  function loadPreviousDay() {
    const copied = duplicateFromPrevious(selectedDate);
    if (!copied) return;
    setDraft(copied);
    setTouched(new Set(allSections));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveEntry({ ...draft, date: selectedDate });
      onSaved(
        new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setSaveError("Не удалось сохранить. Проверьте интернет.");
    } finally {
      setSaving(false);
    }
  }

  const mood = filled.mood ? closestMood(draft.moodScore) : null;
  const pains = draft.pains
    .map((pain) => `${pain.type} · ${pain.level} из 10`)
    .join(", ");
  const foodSummary = [
    draft.meals.join(", "),
    draft.lastMealTime && `ППП ${draft.lastMealTime}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <DayHeader
        selectedDate={selectedDate}
        status={
          savedAt
            ? `Сохранено в ${savedAt}`
            : existingEntry
              ? "Запись есть"
              : "Новая запись"
        }
        statusDone={Boolean(existingEntry)}
      />

      <WeekStrip
        selectedDate={selectedDate}
        entriesMap={entriesMap}
        onSelect={setSearchDate}
      />

      <section className="rounded-3xl bg-surface p-[18px] shadow-soft">
        <div className="mb-4 flex items-center gap-3.5">
          <ProgressRing value={filledCount} total={allSections.length} />
          <div>
            <h2 className="text-base font-semibold text-ink">Как вы сегодня?</h2>
            <p className="text-[13px] text-muted">
              {leftCount
                ? `Осталось ${leftCount} ${pluralSections(leftCount)}`
                : "Всё заполнено"}
            </p>
          </div>
        </div>

        <p className="mb-2 text-[13px] font-semibold text-ink-soft">Настроение</p>
        <div role="radiogroup" aria-label="Настроение" className="grid grid-cols-5 gap-1.5">
          {moods.map((item) => {
            const active = mood?.score === item.score;
            return (
              <button
                key={item.score}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update("mood", { moodScore: item.score })}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border pt-2.5 pb-2 text-[22px] leading-none transition",
                  active
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-wash-soft",
                )}
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span
                  className={cn(
                    "text-[10.5px]",
                    active ? "font-semibold text-accent-strong" : "text-muted",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-2xl bg-wash-soft px-3 py-2.5">
            <div>
              <p className="text-xs text-muted">Сон</p>
              <p className="text-lg font-semibold text-ink">
                {draft.sleepHours}{" "}
                <span className="text-[13px] font-medium text-muted">ч</span>
              </p>
            </div>
            <div className="flex gap-1">
              <StepButton
                label="Меньше сна"
                onClick={() =>
                  update("sleep", { sleepHours: Math.max(0, draft.sleepHours - 1) })
                }
              >
                −
              </StepButton>
              <StepButton
                label="Больше сна"
                onClick={() =>
                  update("sleep", { sleepHours: Math.min(16, draft.sleepHours + 1) })
                }
              >
                +
              </StepButton>
            </div>
          </div>
          <label className="block rounded-2xl bg-wash-soft px-3 py-2.5">
            <span className="block text-xs text-muted">Шаги</span>
            <input
              type="number"
              inputMode="numeric"
              value={draft.steps?.toString() || ""}
              placeholder="—"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  steps: parseNumber(event.target.value),
                }))
              }
              className="w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-muted"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between px-1 pt-2">
        <h2 className="text-[13px] font-semibold text-muted">Дневник</h2>
        <button
          type="button"
          onClick={loadPreviousDay}
          disabled={!previousEntry}
          className="text-[13px] font-medium text-accent-strong disabled:opacity-40"
        >
          Как в прошлый раз
        </button>
      </div>

      <section className="overflow-hidden rounded-3xl bg-surface py-1 shadow-soft">
        <SectionRow
          id="medications"
          icon={<PillIcon />}
          title="Лекарства"
          summary={draft.medications.join(", ")}
          filled={filled.medications}
          emptyText="Ничего не отмечено"
          open={open.has("medications")}
          onToggle={toggleOpen}
        >
          <div className="flex flex-wrap gap-1.5">
            {medicationPool.map((item) => (
              <Chip
                key={item}
                active={draft.medications.includes(item)}
                onClick={() => toggleListItem("medications", item)}
              >
                {item}
              </Chip>
            ))}
          </div>
          <AddRow
            value={medicineInput}
            onChange={setMedicineInput}
            onAdd={() => addCustomChip("medications", medicineInput)}
          />
        </SectionRow>

        <SectionRow
          id="pain"
          icon={<PulseIcon />}
          title="Самочувствие"
          summary={pains || (filled.pain ? "Болей нет" : "")}
          filled={filled.pain}
          open={open.has("pain")}
          onToggle={toggleOpen}
        >
          <p className="text-xs text-muted">Где болит? Отметьте и задайте силу.</p>
          <div className="flex flex-wrap gap-1.5">
            {painPool.map((type) => (
              <Chip
                key={type}
                active={draft.pains.some((pain) => pain.type === type)}
                onClick={() => togglePain(type)}
              >
                {type}
              </Chip>
            ))}
          </div>
          {draft.pains.map((pain) => (
            <ScaleField
              key={pain.type}
              label={pain.type}
              value={pain.level}
              min={1}
              max={10}
              onChange={(value) => setPainLevel(pain.type, value)}
            />
          ))}
          {!filled.pain ? (
            <button
              type="button"
              onClick={() => update("pain", { pains: [] })}
              className="text-[13px] font-medium text-accent-strong"
            >
              Сегодня ничего не болит
            </button>
          ) : null}
        </SectionRow>

        <SectionRow
          id="sleep"
          icon={<MoonIcon />}
          title="Качество сна"
          summary={`${draft.sleepHours} ч · ${draft.sleepQuality} из 10`}
          filled={filled.sleep}
          open={open.has("sleep")}
          onToggle={toggleOpen}
        >
          <ScaleField
            label="Как спалось"
            value={draft.sleepQuality}
            min={1}
            max={10}
            lowLabel="тяжело"
            highLabel="восстановил"
            onChange={(value) => update("sleep", { sleepQuality: value })}
          />
        </SectionRow>

        <SectionRow
          id="state"
          icon={<LeafIcon />}
          title="Состояние"
          summary={`${kgName} ${draft.kgScore} · ${stName} ${draft.stScore}`}
          filled={filled.state}
          open={open.has("state")}
          onToggle={toggleOpen}
        >
          <ScaleField
            label={kgName}
            value={draft.kgScore}
            lowLabel="низко"
            highLabel="высоко"
            onChange={(value) => update("state", { kgScore: value })}
          />
          <ScaleField
            label={stName}
            value={draft.stScore}
            lowLabel="спокойно"
            highLabel="напряжённо"
            onChange={(value) => update("state", { stScore: value })}
          />
          <TextArea
            value={draft.stComment}
            placeholder={`Комментарий к ${stName}: что влияло сегодня`}
            onChange={(value) => update("state", { stComment: value })}
          />
          <TextArea
            value={draft.moodNote}
            placeholder="Пара слов о настроении"
            onChange={(value) => update("state", { moodNote: value })}
          />
        </SectionRow>

        <SectionRow
          id="food"
          icon={<ForkIcon />}
          title="Питание"
          summary={foodSummary}
          filled={filled.food}
          open={open.has("food")}
          onToggle={toggleOpen}
        >
          <div className="flex flex-wrap gap-1.5">
            {mealPool.map((item) => (
              <Chip
                key={item}
                active={draft.meals.includes(item)}
                onClick={() => toggleListItem("meals", item)}
              >
                {item}
              </Chip>
            ))}
          </div>
          <AddRow
            value={mealInput}
            onChange={setMealInput}
            onAdd={() => addCustomChip("meals", mealInput)}
          />
          <label className="flex items-center justify-between gap-3 text-sm text-ink-soft">
            <span>
              Последний приём пищи
              <span className="block text-xs text-muted">ППП</span>
            </span>
            <span className="w-32">
              <TextInput
                type="time"
                value={draft.lastMealTime}
                onChange={(value) => update("food", { lastMealTime: value })}
              />
            </span>
          </label>
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">Овощи и фрукты, порций</p>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((servings) => (
                <Chip
                  key={servings}
                  active={draft.produceServings === servings}
                  onClick={() => update("food", { produceServings: servings })}
                >
                  {servings}
                </Chip>
              ))}
            </div>
          </div>
        </SectionRow>

        <SectionRow
          id="weight"
          icon={<ScaleIcon />}
          title="Вес"
          summary={draft.weight !== null ? `${draft.weight} кг` : ""}
          filled={filled.weight}
          open={open.has("weight")}
          onToggle={toggleOpen}
        >
          <TextInput
            type="number"
            value={draft.weight?.toString() || ""}
            placeholder="Например, 63.4"
            onChange={(value) => update("weight", { weight: parseNumber(value) })}
          />
        </SectionRow>
      </section>

      <div className="px-1 pt-2">
        <h2 className="text-[13px] font-semibold text-muted">Заметка дня</h2>
      </div>
      <section className="rounded-3xl bg-surface p-2 shadow-soft">
        <textarea
          value={draft.notes}
          rows={3}
          placeholder="Что было важно заметить сегодня…"
          onChange={(event) =>
            setDraft((current) => ({ ...current, notes: event.target.value }))
          }
          className="w-full resize-none rounded-2xl bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
        />
      </section>

      {dirty || saving || saveError ? (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-30 mx-auto w-[calc(100%-24px)] max-w-[436px]">
          <div className="flex items-center gap-2.5 rounded-[20px] bg-ink/95 py-2 pr-2 pl-4 text-white shadow-bar backdrop-blur-md">
            <p
              role={saveError ? "alert" : "status"}
              className={cn(
                "flex-1 text-[13px]",
                saveError ? "text-accent" : "text-white/75",
              )}
            >
              {saveError || (saving ? "Сохраняем…" : "Изменения не сохранены")}
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-[14px] bg-accent px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
            >
              {saveError ? "Ещё раз" : "Сохранить"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DayHeader({
  selectedDate,
  status,
  statusDone,
}: {
  selectedDate: string;
  status: string;
  statusDone: boolean;
}) {
  const today = getTodayKey();
  const date = toDate(selectedDate);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date);
  const dayMonth = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);

  let title = capitalize(weekday);
  let subtitle = dayMonth;
  if (selectedDate === today) {
    title = "Сегодня";
    subtitle = `${capitalize(weekday)}, ${dayMonth}`;
  } else if (selectedDate === addDays(today, -1)) {
    title = "Вчера";
    subtitle = `${capitalize(weekday)}, ${dayMonth}`;
  }

  return (
    <header className="flex items-end justify-between gap-3 px-1 pt-1">
      <div>
        <p className="mb-0.5 text-[13px] text-muted">{subtitle}</p>
        <h1 className="text-[32px] leading-[1.05] font-bold tracking-[-0.035em] text-ink">
          {title}
        </h1>
      </div>
      <p className="flex items-center gap-1.5 pb-1 text-xs text-muted">
        <span
          className={cn(
            "size-[7px] rounded-full",
            statusDone ? "bg-sage" : "bg-accent",
          )}
        />
        {status}
      </p>
    </header>
  );
}

function WeekStrip({
  selectedDate,
  entriesMap,
  onSelect,
}: {
  selectedDate: string;
  entriesMap: EntriesMap;
  onSelect: (date: string) => void;
}) {
  const today = getTodayKey();
  const offset = (toDate(selectedDate).getDay() + 6) % 7;
  const monday = addDays(selectedDate, -offset);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const nextWeek = addDays(selectedDate, 7);

  return (
    <div className="flex items-center gap-0.5">
      <ArrowButton
        label="Предыдущая неделя"
        onClick={() => onSelect(addDays(selectedDate, -7))}
        flip
      />
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((day, index) => {
          const active = day === selectedDate;
          const future = day > today;
          return (
            <button
              key={day}
              type="button"
              disabled={future}
              aria-current={active ? "date" : undefined}
              onClick={() => onSelect(day)}
              className={cn(
                "flex flex-col items-center gap-[3px] rounded-2xl pt-2 pb-[7px] transition disabled:opacity-35",
                active ? "bg-ink text-white" : "text-ink-soft",
              )}
            >
              <span
                className={cn(
                  "text-[11px]",
                  active ? "text-white/70" : day === today ? "font-semibold text-accent-strong" : "text-muted",
                )}
              >
                {weekdayShort[index]}
              </span>
              <span className="text-base font-semibold">{toDate(day).getDate()}</span>
              <span
                className={cn(
                  "size-[5px] rounded-full",
                  entriesMap[day] ? (active ? "bg-white" : "bg-accent") : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
      <ArrowButton
        label="Следующая неделя"
        disabled={monday >= addDays(today, -((toDate(today).getDay() + 6) % 7))}
        onClick={() => onSelect(nextWeek > today ? today : nextWeek)}
      />
    </div>
  );
}

function ArrowButton({
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
      className="grid h-14 w-6 place-items-center rounded-xl text-muted disabled:opacity-25"
    >
      <ChevronIcon width={16} height={16} className={flip ? "rotate-180" : undefined} />
    </button>
  );
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const circumference = 2 * Math.PI * 20;
  return (
    <svg viewBox="0 0 48 48" className="size-12 flex-none" role="img" aria-label={`Заполнено ${value} из ${total}`}>
      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-wash)" strokeWidth="5" />
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke={value === total ? "var(--color-sage)" : "var(--color-accent-strong)"}
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - value / total)}
        className="transition-[stroke-dashoffset] duration-500"
      />
      <text x="24" y="28.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--color-ink)">
        {value}/{total}
      </text>
    </svg>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-line bg-surface text-base leading-none text-ink-soft"
    >
      {children}
    </button>
  );
}

function SectionRow({
  id,
  icon,
  title,
  summary,
  filled,
  emptyText = "Не заполнено",
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  icon: ReactNode;
  title: string;
  summary: string;
  filled: boolean;
  emptyText?: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
}) {
  const panelId = `section-${id}`;
  return (
    <div className="border-wash not-first:border-t">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="grid size-9 flex-none place-items-center rounded-xl bg-accent-tint text-accent-strong [&>svg]:size-[18px]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink">{title}</span>
          <span
            className={cn(
              "block truncate text-[13px]",
              filled && summary ? "text-muted" : "text-accent-strong",
            )}
          >
            {filled && summary ? summary : emptyText}
          </span>
        </span>
        {open ? (
          <ChevronIcon width={16} height={16} className="rotate-90 text-muted" />
        ) : filled ? (
          <span className="grid size-[22px] flex-none place-items-center rounded-full bg-sage-soft text-sage">
            <CheckIcon width={12} height={12} />
          </span>
        ) : (
          <span className="size-[22px] flex-none rounded-full border-[1.5px] border-dashed border-line" />
        )}
      </button>
      {open ? (
        <div id={panelId} className="space-y-3 px-4 pb-4 sm:pl-16">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function AddRow({
  value,
  onChange,
  onAdd,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
    >
      <TextInput value={value} placeholder="Добавить своё" onChange={onChange} />
      <button
        type="submit"
        aria-label="Добавить"
        className="rounded-2xl border border-line bg-surface px-4 text-lg leading-none text-accent-strong"
      >
        +
      </button>
    </form>
  );
}
