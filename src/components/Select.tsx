import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Modal } from './Modal'
import './Select.css'

/**
 * Modern themed dropdown that presents its options in a Modal.
 *
 * Rather than a floating popover (which is fiddly on mobile and always
 * risks stacking-context issues), the option list is always shown in a
 * `<Modal>` — a bottom sheet on mobile and a centered dialog on
 * desktop. Same pattern is intended to be reused by future picker-style
 * components (Menu, Combobox, etc.).
 *
 * Preserved from the popover version:
 *   - ARIA combobox + listbox roles and relationships
 *   - Keyboard: ArrowUp/Down, Home/End, Enter/Space, Escape, type-to-search
 *   - Return focus to trigger after selection
 *   - Semantic theming (no hard-coded colors)
 */
export interface SelectOption<V extends string> {
  value: V
  label: string
  /** Optional secondary text shown to the right of the label. */
  description?: string
  disabled?: boolean
}

export interface SelectProps<V extends string> {
  value: V
  onChange: (value: V) => void
  options: ReadonlyArray<SelectOption<V>>
  /** Accessible label for the combobox trigger AND the modal. */
  ariaLabel?: string
  /** Optional title shown at the top of the modal. */
  title?: string
  /** Placeholder shown when no option matches `value`. */
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Optional id for the trigger (useful when pairing with a `<label htmlFor>`). */
  id?: string
}

export function Select<V extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  title,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  id,
}: SelectProps<V>) {
  const listboxId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value)),
  )

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  // When the modal opens, sync active index to the current value and
  // move focus into the list so keyboard nav works immediately.
  useEffect(() => {
    if (!open) return
    const idx = Math.max(0, options.findIndex((o) => o.value === value))
    setActiveIndex(idx)
    queueMicrotask(() => {
      listRef.current?.focus()
      listRef.current
        ?.querySelector<HTMLLIElement>(`[data-index="${idx}"]`)
        ?.scrollIntoView({ block: 'nearest' })
    })
  }, [open, options, value])

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to trigger for good keyboard UX.
    queueMicrotask(() => triggerRef.current?.focus())
  }, [])

  const commit = useCallback(
    (idx: number) => {
      const opt = options[idx]
      if (!opt || opt.disabled) return
      onChange(opt.value)
      close()
    },
    [onChange, options, close],
  )

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        const n = options.length
        if (n === 0) return current
        let next = current
        for (let i = 0; i < n; i++) {
          next = (next + delta + n) % n
          if (!options[next].disabled) break
        }
        return next
      })
    },
    [options],
  )

  // Type-to-search — jump to the next option whose label starts with
  // the pressed key. Resets after 500ms of no keypresses.
  const searchRef = useRef<{ q: string; timer: number | null }>({
    q: '',
    timer: null,
  })
  const typeAhead = useCallback(
    (char: string) => {
      const s = searchRef.current
      s.q += char.toLowerCase()
      if (s.timer) window.clearTimeout(s.timer)
      s.timer = window.setTimeout(() => {
        s.q = ''
        s.timer = null
      }, 500)
      const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(s.q))
      if (idx >= 0) setActiveIndex(idx)
    },
    [options],
  )

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault()
        setOpen(true)
        break
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveActive(-1)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          typeAhead(e.key)
        }
    }
  }

  return (
    <div className={'relative ' + className}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        onKeyDown={onTriggerKeyDown}
        className={
          'w-full flex items-center justify-between gap-2 rounded-lg border border-strong ' +
          'bg-surface text-default px-3 py-2 text-sm text-left shadow-sm ' +
          'transition-colors hover:bg-surface-muted ' +
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ' +
          (disabled ? 'opacity-60 cursor-not-allowed ' : 'cursor-pointer ') +
          (open ? 'ring-2 ring-primary-500 ' : '')
        }
      >
        <span className={selected ? '' : 'text-subtle'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={
            'shrink-0 text-subtle transition-transform ' +
            (open ? 'rotate-180' : '')
          }
        />
      </button>

      {/* Modal presenting the option list */}
      <Modal
        open={open}
        onClose={close}
        ariaLabel={ariaLabel ?? title}
      >
        {title && (
          <div className="px-4 pt-3 pb-2 text-sm font-semibold text-default">
            {title}
          </div>
        )}
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listboxId}-opt-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className="py-1 focus:outline-none"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isActive = i === activeIndex
            return (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                data-index={i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  // Prevent losing focus before we commit.
                  e.preventDefault()
                  commit(i)
                }}
                className={
                  'flex items-center gap-2 px-4 py-3 text-sm cursor-pointer select-none ' +
                  (opt.disabled ? 'opacity-50 cursor-not-allowed ' : '') +
                  (isActive && !opt.disabled ? 'bg-surface-muted ' : '') +
                  (isSelected
                    ? 'text-primary-on-soft font-medium '
                    : 'text-default ')
                }
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-subtle">{opt.description}</span>
                )}
                {isSelected && (
                  <Check
                    size={16}
                    className="text-primary shrink-0"
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ul>
      </Modal>
    </div>
  )
}

export default Select
