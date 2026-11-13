import { useState } from "react";
import { supabase } from "../../shared/lib/supabase";
import { loadEntries } from "../entries/storage";
import { useEntries } from "../entries/useEntries";
import { Card } from "../../shared/ui/Card";

export function SettingsScreen() {
  const { entriesMap, accountEmail, importLocalEntries } = useEntries();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const localCount = Object.keys(loadEntries()).length;
  const count = Object.keys(entriesMap).length;

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
    if (busy || !window.confirm(`Перенести локальные записи в аккаунт ${accountEmail}? Даты, уже сохранённые в облаке, останутся без изменений.`)) return;
    setBusy(true);
    setMessage("");
    try {
      await importLocalEntries();
      setMessage("Перенос завершён. Существующие облачные записи не заменены. Локальные оригиналы сохранены.");
    } catch { setMessage("Не удалось перенести записи. Локальные оригиналы сохранены. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase!.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch { setMessage("Не удалось выйти. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="px-1 pt-2">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-soft">
          Аккаунт
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">
          Настройки
        </h1>
      </div>

      <Card>
        <p className="text-sm text-muted">Сохранено записей</p>
        <p className="mt-3 text-4xl font-semibold text-ink">{count}</p>
        <p className="mt-3 text-sm text-muted">
          Записи хранятся в вашем аккаунте. Для загрузки и сохранения нужен интернет.
        </p>
      </Card>

      <Card className="space-y-3">
        <button
          type="button"
          onClick={exportData}
          className="w-full rounded-2xl bg-accent-strong px-4 py-3 text-sm font-medium text-white"
        >
          Экспортировать JSON
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={signOut}
          className="w-full rounded-2xl border border-line px-4 py-3 text-sm font-medium text-ink-soft"
        >
          Выйти из аккаунта
        </button>
      </Card>

      <Card>
        <p className="text-sm font-medium text-ink-soft">{accountEmail}</p>
        {localCount > 0 && <>
          <p className="mt-2 text-sm text-muted">На этом устройстве есть прежние локальные записи: {localCount}. Переносите их только в аккаунт владельца дневника. Совпадающие даты в облаке не заменяются.</p>
          <button type="button" disabled={busy} onClick={importData} className="mt-3 w-full rounded-2xl border border-line px-4 py-3 text-sm disabled:opacity-50">{busy ? "Подождите…" : "Перенести локальные записи в этот аккаунт"}</button>
        </>}
        {message && <p role="status" className="mt-3 text-sm text-ink-soft">{message}</p>}
      </Card>
    </div>
  );
}
