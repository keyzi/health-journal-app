import { useEntries } from "../entries/useEntries";
import { Card } from "../../shared/ui/Card";

export function SettingsScreen() {
  const { entriesMap, clearEntries } = useEntries();
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

  function resetData() {
    if (window.confirm("Удалить все локальные записи?")) {
      clearEntries();
    }
  }

  return (
    <div className="space-y-4">
      <div className="px-1 pt-2">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
          Local
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900">
          Настройки
        </h1>
      </div>

      <Card>
        <p className="text-sm text-stone-500">Сохранено записей</p>
        <p className="mt-3 text-4xl font-semibold text-stone-900">{count}</p>
        <p className="mt-3 text-sm text-stone-500">
          Данные хранятся локально и доступны офлайн после первого открытия.
        </p>
      </Card>

      <Card className="space-y-3">
        <button
          type="button"
          onClick={exportData}
          className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
        >
          Экспортировать JSON
        </button>
        <button
          type="button"
          onClick={resetData}
          className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600"
        >
          Очистить локальные данные
        </button>
      </Card>

      <Card>
        <p className="text-sm font-medium text-stone-700">
          Архитектура готова к следующему шагу
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Структура уже разбита на features и может быть обёрнута в Capacitor
          без перестройки UI слоя.
        </p>
      </Card>
    </div>
  );
}
