import type { ReactNode } from 'react'

/**
 * Accessible toggle switch built on a native `<input type="checkbox">`.
 *
 * - Fully keyboard-accessible & screen-reader-friendly (uses a real checkbox
 *   with `sr-only`; visual state is driven by the `peer` variant).
 * - Themed via semantic utilities (`bg-surface-strong`, `bg-primary`,
 *   `text-subtle`) so re-theming happens from `src/index.css`.
 * - Supports either a plain string label or a rich label with a hint.
 */
export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Visible label rendered next to the switch. */
  label: ReactNode
  /** Optional smaller helper text rendered beneath the label. */
  hint?: ReactNode
  /**
   * Accessible label to expose to assistive tech. Defaults to the string
   * form of `label` (when it is a string). Provide this when `label` is
   * a `ReactNode` that doesn't stringify meaningfully.
   */
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  ariaLabel,
  disabled = false,
  className = '',
}: SwitchProps) {
  const resolvedAriaLabel =
    ariaLabel ?? (typeof label === 'string' ? label : undefined)

  return (
    <label
      className={
        'flex items-start gap-3 select-none ' +
        (disabled ? 'opacity-60 cursor-not-allowed ' : 'cursor-pointer ') +
        className
      }
    >
      {/* Track + thumb. The input is visually hidden but drives state via `peer-*`. */}
      <span className="relative inline-block w-11 h-6 shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={resolvedAriaLabel}
        />
        <span
          className="absolute inset-0 rounded-full bg-surface-strong transition-colors peer-checked:bg-primary"
          aria-hidden="true"
        />
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
          aria-hidden="true"
        />
      </span>

      {(label || hint) && (
        <span className="flex flex-col">
          {label && <span className="font-medium">{label}</span>}
          {hint && <span className="text-sm text-subtle">{hint}</span>}
        </span>
      )}
    </label>
  )
}

export default Switch
