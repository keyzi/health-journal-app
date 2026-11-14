import type { PropsWithChildren } from 'react'
import { cn } from '../lib/cn'

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-3xl bg-surface p-5 shadow-soft',
        className,
      )}
    >
      {children}
    </section>
  )
}
