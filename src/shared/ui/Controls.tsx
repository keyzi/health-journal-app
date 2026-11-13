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
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-accent-strong/10 bg-accent-strong text-white shadow-chip"
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

type SliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  lowLabel?: string;
  highLabel?: string;
  onChange: (value: number) => void;
};

export function SliderField({
  label,
  value,
  min = 0,
  max = 10,
  step = 1,
  lowLabel,
  highLabel,
  onChange,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <Field label={label} hint={`${value}/${max}`}>
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent-strong"
          style={{
            background: `linear-gradient(to right, var(--color-accent-strong) 0%, var(--color-accent-strong) ${percent}%, var(--color-line) ${percent}%, var(--color-line) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-muted-soft">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </Field>
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
