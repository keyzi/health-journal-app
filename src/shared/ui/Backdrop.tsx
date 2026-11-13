import type { PropsWithChildren } from 'react'

// Общий фон для приложения и экрана входа.
export function Backdrop({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,var(--color-surface)_0%,var(--color-canvas)_45%,var(--color-canvas-deep)_100%)] text-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(217,165,176,0.28),transparent_62%)]" />
      {children}
    </div>
  )
}
