/**
 * SegmentedControl — a small horizontal group of mutually-exclusive
 * option buttons (think iOS segmented control / radio group).
 *
 * Generic over the option `value` type so callers get full type-safety
 * on the `value` / `onChange` pair.
 *
 * Themed with the app's semantic tokens (`bg-surface`, `text-default`,
 * `bg-primary`, `border-strong`) — no color literals here.
 */
export interface SegmentedOption<V extends string> {
  value: V
  label: string
}

export interface SegmentedControlProps<V extends string> {
  value: V
  onChange: (value: V) => void
  options: ReadonlyArray<SegmentedOption<V>>
  /** Accessible label for the radiogroup. */
  ariaLabel?: string
  className?: string
}

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
}: SegmentedControlProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={
        'inline-flex rounded-lg border border-strong overflow-hidden ' +
        className
      }
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={
              'px-4 py-2 text-sm transition-colors ' +
              (active
                ? 'bg-primary text-white'
                : 'bg-surface text-default hover:bg-surface-muted')
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
