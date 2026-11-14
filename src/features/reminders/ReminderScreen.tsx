import { useEffect, useState } from "react";
import { cn } from "../../shared/lib/cn";
import { Card } from "../../shared/ui/Card";
import { ListCard } from "../../shared/ui/Page";
import {
  checkAvailability,
  disableReminder,
  enableReminder,
  loadReminder,
  sendTestReminder,
  updateReminderTime,
  type ReminderState,
  type Unavailable,
} from "./push";

const unavailableText: Record<Unavailable, string> = {
  "not-configured":
    "Напоминания ещё не настроены: при сборке приложения не задан ключ VITE_VAPID_PUBLIC_KEY.",
  dev: "В режиме разработки напоминания не работают. Проверьте их в опубликованном приложении.",
  "ios-not-installed":
    "На iPhone напоминания работают только в установленном приложении. Откройте меню «Поделиться» в Safari, выберите «На экран „Домой“» и откройте дневник оттуда.",
  unsupported: "Этот браузер не поддерживает push-уведомления.",
  denied:
    "Уведомления для дневника запрещены. Разрешите их в настройках браузера или телефона и вернитесь сюда.",
};

export function ReminderSettings() {
  const [unavailable] = useState(checkAvailability);
  const [state, setState] = useState<ReminderState | null>(null);
  const [time, setTime] = useState("21:00");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  useEffect(() => {
    if (unavailable) return;
    let active = true;
    loadReminder()
      .then((loaded) => {
        if (!active) return;
        setState(loaded);
        setTime(loaded.time);
      })
      .catch(() => active && setMessage({ text: "Не удалось загрузить настройку. Проверьте интернет.", tone: "error" }));
    return () => {
      active = false;
    };
  }, [unavailable]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error && error.message === "permission"
            ? "Без разрешения на уведомления напоминание не сможет прийти."
            : "Не получилось. Проверьте интернет и попробуйте ещё раз.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    if (!state) return;
    void run(async () => {
      if (state.enabled) {
        await disableReminder();
        setState({ enabled: false, time });
      } else {
        await enableReminder(time);
        setState({ enabled: true, time });
        setMessage({ text: `Готово. Напомним в ${time}, если день ещё не заполнен.`, tone: "ok" });
      }
    });
  }

  function changeTime(next: string) {
    setTime(next);
    if (!state?.enabled || !next) return;
    void run(async () => {
      await updateReminderTime(next);
      setState({ enabled: true, time: next });
      setMessage({ text: `Время изменено: ${next}.`, tone: "ok" });
    });
  }

  function test() {
    void run(async () => {
      const result = await sendTestReminder();
      setMessage(
        result?.sent
          ? { text: "Отправили. Уведомление придёт в течение минуты.", tone: "ok" }
          : { text: "Не нашли ни одного устройства с включённым напоминанием.", tone: "error" },
      );
    });
  }

  if (unavailable) {
    return (
      <Card>
        <p className="text-sm leading-relaxed text-ink-soft">{unavailableText[unavailable]}</p>
      </Card>
    );
  }

  return (
    <>
      <ListCard>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex-1">
            <span className="block text-[15px] text-ink">Напоминать заполнить день</span>
            <span className="text-[12.5px] text-muted">на этом устройстве</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(state?.enabled)}
            aria-label="Напоминание"
            disabled={busy || !state}
            onClick={toggle}
            className={cn(
              "relative h-[26px] w-11 flex-none rounded-full transition disabled:opacity-50",
              state?.enabled ? "bg-sage" : "bg-line",
              "after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform",
              state?.enabled && "after:translate-x-[18px]",
            )}
          />
        </div>
        <label className="flex items-center gap-3 px-4 py-3">
          <span className="flex-1 text-[15px] text-ink">Время</span>
          <input
            type="time"
            value={time}
            step={900}
            disabled={busy}
            onChange={(event) => changeTime(event.target.value)}
            className="rounded-xl border border-line bg-wash-soft px-3 py-2 text-[15px] text-ink outline-none focus:border-accent/70"
          />
        </label>
      </ListCard>

      {message ? (
        <p role="status" className={cn("px-1.5 text-sm", message.tone === "ok" ? "text-sage" : "text-danger")}>
          {message.text}
        </p>
      ) : null}

      {state?.enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={test}
          className="w-full rounded-2xl border border-line bg-surface py-3 text-sm font-semibold text-ink-soft disabled:opacity-50"
        >
          Прислать тестовое уведомление
        </button>
      ) : null}

      <p className="px-1.5 text-xs leading-snug text-muted">
        Напоминание приходит один раз в день в выбранное время (с точностью до 15 минут) и только если запись за
        сегодня ещё не сохранена. Каждое устройство настраивается отдельно.
      </p>
    </>
  );
}
