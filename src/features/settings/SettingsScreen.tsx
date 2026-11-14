import { useState, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "../../shared/lib/supabase";
import { cn } from "../../shared/lib/cn";
import { loadEntries } from "../entries/storage";
import { useEntries } from "../entries/useEntries";
import { Card } from "../../shared/ui/Card";
import { ListCard, PageHeader, SectionLabel } from "../../shared/ui/Page";
import {
  BellIcon,
  ChevronIcon,
  DownloadIcon,
  ForkIcon,
  LeafIcon,
  PillIcon,
  PulseIcon,
  UploadIcon,
} from "../../shared/ui/icons";
import { listTitles, type ListKind } from "./journalSettings";
import { ReminderSettings } from "../reminders/ReminderScreen";
import { useReminderSummary } from "../reminders/useReminderSummary";

function pluralEntries(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "запись";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "записи";
  return "записей";
}

const listKinds: ListKind[] = ["medications", "pains", "meals"];

export function SettingsScreen() {
  const { section } = useParams();
  if (!section) return <SettingsHome />;
  if (section === "scales") return <ScalesEditor />;
  if (section === "reminder")
    return (
      <SubPage title="Напоминание" subtitle="Вечером, если день не заполнен">
        <ReminderSettings />
      </SubPage>
    );
  if (listKinds.includes(section as ListKind)) return <ListEditor kind={section as ListKind} />;
  return <Navigate to="/settings" replace />;
}

function SettingsHome() {
  const { entriesMap, accountEmail, importLocalEntries, settings } = useEntries();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const localCount = Object.keys(loadEntries()).length;
  const count = Object.keys(entriesMap).length;
  const reminder = useReminderSummary();

  function exportData() {
    const file = new Blob([JSON.stringify(entriesMap, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quiet-health-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData() {
    if (
      busy ||
      !window.confirm(
        `Перенести локальные записи в аккаунт ${accountEmail}? Даты, уже сохранённые в облаке, останутся без изменений.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await importLocalEntries();
      setMessage("Перенос завершён. Существующие облачные записи не заменены. Локальные оригиналы сохранены.");
    } catch {
      setMessage("Не удалось перенести записи. Локальные оригиналы сохранены. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase!.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      setMessage("Не удалось выйти. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader subtitle="Аккаунт и данные" title="Ещё" />

      <Card className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-accent-soft text-[17px] font-bold text-accent-strong uppercase">
          {accountEmail.charAt(0) || "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{accountEmail}</span>
          <span className="text-[12.5px] text-muted">
            {count} {pluralEntries(count)}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <i className="size-[7px] rounded-full bg-sage" />в облаке
        </span>
      </Card>

      <SectionLabel>Дневник</SectionLabel>
      <ListCard>
        <SettingsRow to="/settings/medications" icon={<PillIcon />} title={listTitles.medications} value={String(settings.medications.length)} />
        <SettingsRow to="/settings/pains" icon={<PulseIcon />} title={listTitles.pains} value={String(settings.pains.length)} />
        <SettingsRow to="/settings/meals" icon={<ForkIcon />} title={listTitles.meals} value={String(settings.meals.length)} />
        <SettingsRow
          to="/settings/scales"
          icon={<LeafIcon />}
          title="Названия шкал"
          value={`${settings.scaleNames.kg}, ${settings.scaleNames.st}`}
        />
        <SettingsRow to="/settings/reminder" icon={<BellIcon />} title="Напоминание" value={reminder} />
      </ListCard>
      <p className="px-1.5 text-xs leading-snug text-muted">
        Списки появляются как быстрый выбор на экране «Сегодня», в том же порядке.
      </p>

      <SectionLabel>Данные</SectionLabel>
      <ListCard>
        <SettingsRow onClick={exportData} icon={<DownloadIcon />} title="Скачать все записи" value="JSON" />
        {localCount > 0 ? (
          <SettingsRow
            onClick={importData}
            disabled={busy}
            icon={<UploadIcon />}
            title={busy ? "Переносим…" : "Перенести записи с устройства"}
            value={String(localCount)}
          />
        ) : null}
      </ListCard>
      {localCount > 0 ? (
        <p className="px-1.5 text-xs leading-snug text-muted">
          На этом устройстве остались прежние локальные записи. Переносите их только в аккаунт владельца дневника.
          Совпадающие даты в облаке не заменяются.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="px-1.5 text-sm text-ink-soft">
          {message}
        </p>
      ) : null}

      <ListCard className="mt-6">
        <button
          type="button"
          disabled={busy}
          onClick={signOut}
          className="w-full px-4 py-3 text-left text-[15px] text-danger disabled:opacity-50"
        >
          Выйти из аккаунта
        </button>
      </ListCard>
    </div>
  );
}

function SettingsRow({
  to,
  onClick,
  disabled,
  icon,
  title,
  value,
}: {
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon: ReactNode;
  title: string;
  value?: string;
}) {
  const content = (
    <>
      <span className="grid size-[30px] flex-none place-items-center rounded-[9px] bg-accent-tint text-accent-strong [&>svg]:size-4">
        {icon}
      </span>
      <span className="flex-1 text-[15px] text-ink">{title}</span>
      {value ? <span className="max-w-[40%] truncate text-[13.5px] text-muted">{value}</span> : null}
      {to ? <ChevronIcon width={16} height={16} className="flex-none text-muted" /> : null}
    </>
  );
  const className = "flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-50";
  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

function SubPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <Link to="/settings" className="flex items-center gap-0.5 px-1 text-[15px] text-accent-strong">
        <ChevronIcon width={16} height={16} className="rotate-180" />
        Ещё
      </Link>
      <PageHeader subtitle={subtitle} title={title} />
      {children}
    </div>
  );
}

function ListEditor({ kind }: { kind: ListKind }) {
  const { settings, saveSettings } = useEntries();
  const items = settings[kind];
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function commit(next: string[]) {
    setBusy(true);
    setError("");
    try {
      await saveSettings({ ...settings, [kind]: next });
    } catch {
      setError("Не удалось сохранить. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, shift: -1 | 1) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + shift, 0, item);
    void commit(next);
  }

  function add() {
    const value = input.trim();
    if (!value) return;
    setInput("");
    if (items.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    void commit([...items, value]);
  }

  return (
    <SubPage title={listTitles[kind]} subtitle="Быстрый выбор на экране «Сегодня»">
      {items.length ? (
        <ListCard>
          {items.map((item, index) => (
            <div key={item} className="flex items-center gap-1.5 py-1.5 pr-2.5 pl-4">
              <span className="flex-1 text-[15px] text-ink">{item}</span>
              <IconButton label={`Выше: ${item}`} disabled={busy || index === 0} onClick={() => move(index, -1)}>
                <ChevronIcon width={14} height={14} className="-rotate-90" />
              </IconButton>
              <IconButton
                label={`Ниже: ${item}`}
                disabled={busy || index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronIcon width={14} height={14} className="rotate-90" />
              </IconButton>
              <IconButton
                label={`Удалить: ${item}`}
                disabled={busy}
                onClick={() => void commit(items.filter((other) => other !== item))}
              >
                ✕
              </IconButton>
            </div>
          ))}
        </ListCard>
      ) : (
        <Card>
          <p className="text-sm text-muted">Список пуст.</p>
        </Card>
      )}

      <form
        className="flex gap-2 rounded-3xl bg-surface p-2.5 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <input
          value={input}
          maxLength={40}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Добавить"
          aria-label="Новый пункт"
          className="min-w-0 flex-1 rounded-xl border border-line bg-wash-soft px-3 py-2.5 text-sm outline-none focus:border-accent/70 focus:bg-surface"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-ink px-3.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Добавить
        </button>
      </form>
      {error ? (
        <p role="alert" className="px-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <p className="px-1.5 text-xs leading-snug text-muted">
        Удаление из списка не меняет уже сохранённые записи. Настройки хранятся в аккаунте и одинаковы на всех устройствах.
      </p>
    </SubPage>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full bg-wash text-[13px] text-muted disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ScalesEditor() {
  const { settings, saveSettings } = useEntries();
  const [kg, setKg] = useState(settings.scaleNames.kg);
  const [st, setSt] = useState(settings.scaleNames.st);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const changed = kg.trim() !== settings.scaleNames.kg || st.trim() !== settings.scaleNames.st;

  async function save() {
    if (!kg.trim() || !st.trim()) return;
    setBusy(true);
    setStatus("");
    try {
      await saveSettings({ ...settings, scaleNames: { kg: kg.trim(), st: st.trim() } });
      setStatus("Сохранено");
    } catch {
      setStatus("Не удалось сохранить. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SubPage title="Названия шкал" subtitle="Как подписывать шкалы в дневнике">
      <Card className="space-y-4">
        <ScaleNameField label="Первая шкала" hint="от «низко» до «высоко»" value={kg} onChange={setKg} />
        <ScaleNameField label="Вторая шкала" hint="от «спокойно» до «напряжённо»" value={st} onChange={setSt} />
      </Card>
      <button
        type="button"
        disabled={busy || !changed || !kg.trim() || !st.trim()}
        onClick={save}
        className="w-full rounded-2xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy ? "Сохраняем…" : "Сохранить"}
      </button>
      {status ? (
        <p role="status" className={cn("px-1.5 text-sm", status === "Сохранено" ? "text-sage" : "text-danger")}>
          {status}
        </p>
      ) : null}
    </SubPage>
  );
}

function ScaleNameField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-sm">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </span>
      <input
        value={value}
        maxLength={40}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-line bg-wash-soft px-4 py-3 text-sm outline-none focus:border-accent/70 focus:bg-surface"
      />
    </label>
  );
}
