import type { ReactNode } from 'react'

/**
 * Small colored pill for showing a boolean/status (e.g. "Dev mode ON").
 *
 * Uses semantic primary + surface tokens so the pill re-themes automatically
 * with the rest of the app.
 */
export interface StatusPillProps {
  active: boolean
  children: ReactNode
  className?: string
}

export function StatusPill({ active, children, className = '' }: StatusPillProps) {
  return (
    <div
      className={
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ' +
        (active
          ? 'bg-primary-soft text-primary-on-soft'
          : 'bg-surface-muted text-muted') +
        ' ' +
        className
      }
    >
      <span
        className={
          'w-2 h-2 rounded-full ' + (active ? 'bg-primary' : 'bg-neutral-400')
        }
        aria-hidden="true"
      />
      {children}
    </div>
  )
}

export default StatusPill
