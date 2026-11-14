import { useEffect, useState } from "react";
import { checkAvailability, loadReminder } from "./push";

// Значение для строки «Напоминание» на экране «Ещё»
export function useReminderSummary() {
  const [unavailable] = useState(checkAvailability);
  const [summary, setSummary] = useState(unavailable ? "выкл" : "");
  useEffect(() => {
    if (unavailable) return;
    let active = true;
    loadReminder()
      .then((state) => active && setSummary(state.enabled ? state.time : "выкл"))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [unavailable]);
  return summary;
}
