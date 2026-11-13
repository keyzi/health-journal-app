import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type ChipProps = {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-accent bg-accent-soft text-accent-strong"
          : "border-line bg-wash-soft text-ink-soft",
      )}
    >
      {children}
    </button>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-ink-soft">{label}</label>
        {hint ? <span className="text-xs text-muted-soft">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

type ScaleProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  onChange: (value: number) => void;
};

// Шкала из отдельных сегментов: проще попасть пальцем, чем в тонкий range.
export function ScaleField({
  label,
  value,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
  onChange,
}: ScaleProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="font-semibold text-accent-strong">
          {value} из {max}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step) => (
          <button
            key={step}
            type="button"
            role="radio"
            aria-checked={step === value}
            onClick={() => onChange(step)}
            className={cn(
              "h-8 rounded-lg text-[11px] font-medium transition",
              step === value
                ? "bg-accent-strong text-white"
                : step < value
                  ? "bg-accent text-white"
                  : "bg-wash text-muted",
            )}
          >
            {step}
          </button>
        ))}
      </div>
      {lowLabel || highLabel ? (
        <div className="flex justify-between text-xs text-muted-soft">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

type TextInputProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "time" | "date";
};

export function TextInput({
  value,
  placeholder,
  onChange,
  type = "text",
}: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-line bg-wash-soft px-4 py-3 text-sm outline-none transition focus:border-accent/70 focus:bg-surface"
    />
  );
}

type TextAreaProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function TextArea({ value, placeholder, onChange }: TextAreaProps) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={3}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-none rounded-2xl border border-line bg-wash-soft px-4 py-3 text-sm outline-none transition focus:border-accent/70 focus:bg-surface"
    />
  );
}
