import type { PropsWithChildren } from 'react'
import { cn } from '../lib/cn'

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-[30px] border border-surface/70 bg-surface/80 p-5 shadow-card backdrop-blur',
        className,
      )}
    >
      {children}
    </section>
  )
}
