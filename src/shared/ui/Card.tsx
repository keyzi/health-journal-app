import type { PropsWithChildren } from 'react'
import { cn } from '../lib/cn'

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(102,88,71,0.08)] backdrop-blur',
        className,
      )}
    >
      {children}
    </section>
  )
}
