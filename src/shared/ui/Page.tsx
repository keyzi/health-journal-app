import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function PageHeader({
  subtitle,
  title,
  aside,
}: {
  subtitle?: ReactNode
  title: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-1 pt-1">
      <div className="min-w-0">
        {subtitle ? <p className="mb-0.5 text-[13px] text-muted">{subtitle}</p> : null}
        <h1 className="text-[32px] leading-[1.05] font-bold tracking-[-0.035em] text-ink">{title}</h1>
      </div>
      {aside}
    </header>
  )
}

export function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-1 pt-2">
      <h2 className="text-[13px] font-semibold text-muted">{children}</h2>
      {aside}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-xl bg-wash p-[3px]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[10px] px-2.5 py-[7px] text-[13px] font-semibold transition',
            option.value === value ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(60,30,40,0.12)]' : 'text-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Карточка-список: строки разделены тонкой линией
export function ListCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('overflow-hidden rounded-3xl bg-surface py-0.5 shadow-soft [&>*+*]:border-t [&>*+*]:border-wash', className)}>
      {children}
    </section>
  )
}
