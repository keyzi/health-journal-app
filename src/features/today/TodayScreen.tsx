import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  cloneEntry,
  createEmptyEntry,
  mealSuggestions,
  medicationSuggestions,
  painSuggestions,
} from "../entries/defaults";
import { useEntries } from "../entries/useEntries";
import type { HealthEntry } from "../entries/types";
import { getTodayKey, formatLongDate } from "../../shared/lib/date";
import { Card } from "../../shared/ui/Card";
import {
  Chip,
  Field,
  SliderField,
  TextArea,
  TextInput,
} from "../../shared/ui/Controls";

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const next = Number(value.replace(",", "."));
  return Number.isFinite(next) ? next : null;
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function TodayScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get("date") || getTodayKey();
  const { getEntry, getPreviousEntry, duplicateFromPrevious, saveEntry } =
    useEntries();
  const existingEntry = getEntry(selectedDate);
  const previousEntry = getPreviousEntry(selectedDate);
  const editorKey = `${selectedDate}:${existingEntry?.updatedAt ?? "new"}`;

  return (
    <TodayEditor
      key={editorKey}
      selectedDate={selectedDate}
      existingEntry={existingEntry}
      previousEntry={previousEntry}
      duplicateFromPrevious={duplicateFromPrevious}
      saveEntry={saveEntry}
      setSearchDate={(date) => setSearchParams({ date })}
    />
  );
}

type TodayEditorProps = {
  selectedDate: string;
  existingEntry?: HealthEntry;
  previousEntry?: HealthEntry;
  duplicateFromPrevious: (date: string) => HealthEntry | undefined;
  saveEntry: (entry: HealthEntry) => void;
  setSearchDate: (date: string) => void;
};

function TodayEditor({
  selectedDate,
  existingEntry,
  previousEntry,
  duplicateFromPrevious,
  saveEntry,
  setSearchDate,
}: TodayEditorProps) {
  const [draft, setDraft] = useState<HealthEntry>(
    existingEntry ? cloneEntry(existingEntry) : createEmptyEntry(selectedDate),
  );
  const [medicineInput, setMedicineInput] = useState("");
  const [mealInput, setMealInput] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const medicationPool = dedupe([
    ...medicationSuggestions,
    ...(previousEntry?.medications || []),
  ]);
  const mealPool = dedupe([
    ...mealSuggestions,
    ...(previousEntry?.meals || []),
  ]);

  function updateDraft(patch: Partial<HealthEntry>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleListItem(key: "medications" | "meals", value: string) {
    setDraft((current) => {
      const items = current[key];
      const nextItems = items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value];
      return { ...current, [key]: nextItems };
    });
  }

  function togglePain(type: string) {
    setDraft((current) => {
      const exists = current.pains.find((pain) => pain.type === type);
      return exists
        ? {
            ...current,
            pains: current.pains.filter((pain) => pain.type !== type),
          }
        : {
            ...current,
            pains: [...current.pains, { type, level: 4 }],
          };
    });
  }

  function setPainLevel(type: string, level: number) {
    setDraft((current) => ({
      ...current,
      pains: current.pains.map((pain) =>
        pain.type === type ? { ...pain, level } : pain,
      ),
    }));
  }

  function addCustomChip(key: "medications" | "meals", value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setDraft((current) => ({
      ...current,
      [key]: dedupe([...current[key], trimmed]),
    }));
    if (key === "medications") setMedicineInput("");
    if (key === "meals") setMealInput("");
  }

  function save() {
    saveEntry({ ...draft, date: selectedDate });
    setSavedAt(
      new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }

  function loadPreviousDay() {
    const copied = duplicateFromPrevious(selectedDate);
    if (copied) {
      setDraft(copied);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,241,234,0.86))]">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                Quiet Health
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
                Сегодня
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                {formatLongDate(selectedDate)}
              </p>
            </div>
            <div className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs text-stone-500">
              {existingEntry ? "Запись есть" : "Новая запись"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl bg-stone-900 px-4 py-3 text-white">
              <p className="text-xs text-white/60">Сон</p>
              <p className="mt-2 text-2xl font-semibold">{draft.sleepHours}ч</p>
            </div>
            <div className="rounded-3xl bg-white px-4 py-3 text-stone-900">
              <p className="text-xs text-stone-400">Настроение</p>
              <p className="mt-2 text-2xl font-semibold">
                {draft.moodScore}/10
              </p>
            </div>
            <div className="rounded-3xl bg-white px-4 py-3 text-stone-900">
              <p className="text-xs text-stone-400">Шаги</p>
              <p className="mt-2 text-2xl font-semibold">
                {draft.steps?.toLocaleString("ru-RU") || "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSearchDate(getTodayKey())}
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              К сегодня
            </button>
            <button
              type="button"
              onClick={loadPreviousDay}
              disabled={!previousEntry}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 disabled:opacity-40"
            >
              Копировать вчера
            </button>
            {savedAt ? (
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                Сохранено в {savedAt}
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4">
          <Field label="Дата">
            <TextInput
              type="date"
              value={selectedDate}
              onChange={setSearchDate}
            />
          </Field>
          <Field label="Вес" hint="кг">
            <TextInput
              type="number"
              value={draft.weight?.toString() || ""}
              placeholder="Например, 63.4"
              onChange={(value) => updateDraft({ weight: parseNumber(value) })}
            />
          </Field>
          <Field label="Лекарства" hint="быстрый выбор">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
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
              <div className="flex gap-2">
                <TextInput
                  value={medicineInput}
                  placeholder="Добавить своё"
                  onChange={setMedicineInput}
                />
                <button
                  type="button"
                  onClick={() => addCustomChip("medications", medicineInput)}
                  className="rounded-2xl bg-stone-900 px-4 text-sm font-medium text-white"
                >
                  +
                </button>
              </div>
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <Field label="Боли" hint="тип + уровень">
            <div className="flex flex-wrap gap-2">
              {painSuggestions.map((type) => (
                <Chip
                  key={type}
                  active={draft.pains.some((pain) => pain.type === type)}
                  onClick={() => togglePain(type)}
                >
                  {type}
                </Chip>
              ))}
            </div>
          </Field>
          {draft.pains.length ? (
            <div className="space-y-4">
              {draft.pains.map((pain) => (
                <SliderField
                  key={pain.type}
                  label={pain.type}
                  value={pain.level}
                  min={0}
                  max={10}
                  lowLabel="нет"
                  highLabel="сильно"
                  onChange={(value) => setPainLevel(pain.type, value)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400">Сегодня болей не отмечено.</p>
          )}
        </div>
      </Card>

      <Card>
        <div className="grid gap-4">
          <Field label="Сон" hint="длительность">
            <div className="flex flex-wrap gap-2">
              {[5, 6, 7, 8, 9, 10].map((hours) => (
                <Chip
                  key={hours}
                  active={draft.sleepHours === hours}
                  onClick={() => updateDraft({ sleepHours: hours })}
                >
                  {hours} ч
                </Chip>
              ))}
            </div>
          </Field>
          <SliderField
            label="Качество сна"
            value={draft.sleepQuality}
            min={1}
            max={10}
            lowLabel="тяжело"
            highLabel="восстановил"
            onChange={(value) => updateDraft({ sleepQuality: value })}
          />
          <Field label="Активность" hint="шаги">
            <div className="space-y-3">
              <TextInput
                type="number"
                value={draft.steps?.toString() || ""}
                placeholder="7000"
                onChange={(value) => updateDraft({ steps: parseNumber(value) })}
              />
              <div className="flex flex-wrap gap-2">
                {[3000, 6000, 8000, 10000].map((steps) => (
                  <Chip
                    key={steps}
                    active={draft.steps === steps}
                    onClick={() => updateDraft({ steps })}
                  >
                    {steps / 1000}k
                  </Chip>
                ))}
              </div>
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="grid gap-5">
          <SliderField
            label="КГ"
            value={draft.kgScore}
            lowLabel="низко"
            highLabel="высоко"
            onChange={(value) => updateDraft({ kgScore: value })}
          />
          <SliderField
            label="СТ"
            value={draft.stScore}
            lowLabel="спокойно"
            highLabel="напряжённо"
            onChange={(value) => updateDraft({ stScore: value })}
          />
          <Field label="Комментарий к СТ">
            <TextArea
              value={draft.stComment}
              placeholder="Что влияло на состояние сегодня"
              onChange={(value) => updateDraft({ stComment: value })}
            />
          </Field>
          <SliderField
            label="Настроение"
            value={draft.moodScore}
            lowLabel="тяжёлое"
            highLabel="лёгкое"
            onChange={(value) => updateDraft({ moodScore: value })}
          />
          <Field label="Комментарий к настроению">
            <TextArea
              value={draft.moodNote}
              placeholder="Пара слов о дне"
              onChange={(value) => updateDraft({ moodNote: value })}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4">
          <Field label="Питание" hint="приёмы пищи">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
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
              <div className="flex gap-2">
                <TextInput
                  value={mealInput}
                  placeholder="Добавить своё"
                  onChange={setMealInput}
                />
                <button
                  type="button"
                  onClick={() => addCustomChip("meals", mealInput)}
                  className="rounded-2xl bg-stone-900 px-4 text-sm font-medium text-white"
                >
                  +
                </button>
              </div>
            </div>
          </Field>
          <Field label="ППП" hint="последний приём пищи">
            <TextInput
              type="time"
              value={draft.lastMealTime}
              onChange={(value) => updateDraft({ lastMealTime: value })}
            />
          </Field>
          <Field label="Овощи и фрукты" hint="порций за день">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((servings) => (
                <Chip
                  key={servings}
                  active={draft.produceServings === servings}
                  onClick={() => updateDraft({ produceServings: servings })}
                >
                  {servings}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Заметки">
            <TextArea
              value={draft.notes}
              placeholder="Свободная заметка, что было важно заметить сегодня"
              onChange={(value) => updateDraft({ notes: value })}
            />
          </Field>
        </div>
      </Card>

      <button
        type="button"
        onClick={save}
        className="w-full rounded-[26px] bg-stone-900 px-5 py-4 text-base font-medium text-white shadow-[0_20px_40px_rgba(51,48,41,0.18)]"
      >
        Сохранить запись
      </button>
    </div>
  );
}
