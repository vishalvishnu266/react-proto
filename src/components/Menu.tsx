import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Modal } from './Modal'
import type { ModalMode } from './Modal'
import './Menu.css'

/**
 * A single action row inside a `<Menu>`.
 *
 * Menu items are declarative: pass an array of items rather than JSX.
 * This keeps the API tiny and lets Menu handle keyboard navigation,
 * disabled state, destructive styling, and layout consistently.
 */
export interface MenuItem {
  /** Unique key — used for React reconciliation. */
  key: string
  /** Text (or rich node) shown on the row. */
  label: ReactNode
  /** Optional leading icon (typically a lucide-react icon element). */
  icon?: ReactNode
  /** Optional secondary text shown on the right (shortcut, count, etc.). */
  hint?: ReactNode
  /** Fires when the item is activated (click, Enter, Space). */
  onSelect: () => void
  disabled?: boolean
  /**
   * Styles the item red to signal a destructive action (e.g. "Delete").
   * Default false.
   */
  destructive?: boolean
}

export interface MenuProps {
  /** Element that toggles the menu — typically a button. Wrapped in a fragment. */
  trigger: (props: {
    open: () => void
    isOpen: boolean
    ref: React.RefObject<HTMLButtonElement | null>
    id: string
  }) => ReactNode
  items: ReadonlyArray<MenuItem>
  /** Optional title shown at the top of the modal. */
  title?: string
  /** Accessible label if no `title` is provided. */
  ariaLabel?: string
  /** Passed through to `<Modal>`. */
  mode?: ModalMode
  /** Passed through to `<Modal>` — click backdrop to close. */
  closeOnBackdropClick?: boolean
}

/**
 * Action menu built on `<Modal>` — same presentation pattern as
 * `<Select>`. Bottom-sheet on mobile, centered dialog on desktop.
 *
 * Consumers describe the items declaratively; Menu owns:
 *   - keyboard navigation (Arrow keys, Home/End, Enter/Space)
 *   - focus management (moves into the list on open, back to trigger on close)
 *   - destructive-item styling
 *   - ARIA (`role="menu"` / `role="menuitem"`)
 *
 * Example:
 *   const btnRef = useRef<HTMLButtonElement>(null)
 *   <Menu
 *     title="Post actions"
 *     items={[
 *       { key: 'edit',   label: 'Edit',   icon: <PencilIcon />, onSelect: edit },
 *       { key: 'share',  label: 'Share',  icon: <ShareIcon />,  onSelect: share },
 *       { key: 'delete', label: 'Delete', icon: <TrashIcon />,  onSelect: remove, destructive: true },
 *     ]}
 *     trigger={({ open, ref, id, isOpen }) => (
 *       <button ref={ref} id={id} aria-haspopup="menu" aria-expanded={isOpen} onClick={open}>
 *         ⋮
 *       </button>
 *     )}
 *   />
 */
export function Menu({
  trigger,
  items,
  title,
  ariaLabel,
  mode,
  closeOnBackdropClick,
}: MenuProps) {
  const triggerId = useId()
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // Reset active index and focus the list when opening.
  useEffect(() => {
    if (!open) return
    // Skip past leading disabled items.
    const firstEnabled = items.findIndex((it) => !it.disabled)
    setActiveIndex(firstEnabled >= 0 ? firstEnabled : 0)
    queueMicrotask(() => listRef.current?.focus())
  }, [open, items])

  const close = useCallback(() => {
    setOpen(false)
    queueMicrotask(() => triggerRef.current?.focus())
  }, [])

  const commit = useCallback(
    (idx: number) => {
      const it = items[idx]
      if (!it || it.disabled) return
      // Close first, then run the action, so the caller sees the modal
      // already dismissed by the time their handler runs.
      close()
      it.onSelect()
    },
    [items, close],
  )

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        const n = items.length
        if (n === 0) return current
        let next = current
        for (let i = 0; i < n; i++) {
          next = (next + delta + n) % n
          if (!items[next].disabled) break
        }
        return next
      })
    },
    [items],
  )

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
        setActiveIndex(items.findIndex((it) => !it.disabled))
        break
      case 'End':
        e.preventDefault()
        for (let i = items.length - 1; i >= 0; i--) {
          if (!items[i].disabled) {
            setActiveIndex(i)
            break
          }
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
    }
  }

  return (
    <>
      {trigger({
        open: () => setOpen(true),
        isOpen: open,
        ref: triggerRef,
        id: triggerId,
      })}
      <Modal
        open={open}
        onClose={close}
        ariaLabel={ariaLabel ?? title ?? 'Menu'}
        mode={mode}
        closeOnBackdropClick={closeOnBackdropClick}
      >
        {title && (
          <div className="px-4 pt-3 pb-2 text-sm font-semibold text-default">
            {title}
          </div>
        )}
        <ul
          ref={listRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-labelledby={triggerId}
          aria-activedescendant={`${menuId}-item-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className="py-1 focus:outline-none"
        >
          {items.map((it, i) => {
            const isActive = i === activeIndex
            return (
              <li
                key={it.key}
                id={`${menuId}-item-${i}`}
                role="menuitem"
                aria-disabled={it.disabled || undefined}
                onMouseEnter={() => !it.disabled && setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault() // keep focus in the list until commit
                  commit(i)
                }}
                className={
                  'menu-item flex items-center gap-3 px-4 py-3 text-sm cursor-pointer select-none ' +
                  (it.disabled ? 'opacity-50 cursor-not-allowed ' : '') +
                  (isActive && !it.disabled ? 'bg-surface-muted ' : '') +
                  (it.destructive
                    ? 'text-red-600 dark:text-red-400 '
                    : 'text-default ')
                }
              >
                {it.icon && (
                  <span className="shrink-0 flex items-center" aria-hidden="true">
                    {it.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{it.label}</span>
                {it.hint && (
                  <span className="text-xs text-subtle shrink-0">{it.hint}</span>
                )}
              </li>
            )
          })}
        </ul>
      </Modal>
    </>
  )
}

export default Menu
