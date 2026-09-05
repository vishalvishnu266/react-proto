import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModal } from './hooks/useModal'
import './Modal.css'

/**
 * Presentation mode for the modal:
 *   - `sheet`  : bottom-anchored, full-width, slides up (mobile)
 *   - `dialog` : centered card (desktop)
 *   - `auto`   : `sheet` on narrow viewports, `dialog` on wide ones
 */
export type ModalMode = 'sheet' | 'dialog' | 'auto'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children?: ReactNode
  /** Visual mode. Default `'auto'`. */
  mode?: ModalMode
  /** Breakpoint (px) below which `auto` picks `sheet`. Default 640. */
  mobileBreakpoint?: number
  /** Accessible label announced by screen readers. */
  ariaLabel?: string
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdropClick?: boolean
  /** Close when Escape is pressed. Default true. */
  closeOnEscape?: boolean
  /**
   * Close when the browser/Android back button is pressed. Default true.
   * Uses a `history.pushState` placeholder + `popstate` listener; see
   * `useModal` for details.
   */
  closeOnBack?: boolean
}

/**
 * Reusable modal shell — the presentation-layer building block for any
 * dropdown-like UI that should render as a modal on mobile.
 *
 * Dismissed by:
 *   - Tapping the backdrop
 *   - Pressing Escape
 *   - Pressing the browser/Android back button (or the system back
 *     gesture on modern Android/iOS PWAs)
 *
 * The modal panel is fixed in place — no drag/swipe gestures. On mobile
 * this feels right because the back-button pattern is what users expect
 * in native Android apps.
 */
export function Modal({
  open,
  onClose,
  children,
  mode = 'auto',
  mobileBreakpoint = 640,
  ariaLabel,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  closeOnBack = true,
}: ModalProps) {
  useModal({ open, onClose, closeOnEscape, closeOnBack })

  // Resolve the actual mode. Recomputed on window resize so rotating a
  // tablet, for example, switches between sheet and dialog.
  const [resolvedMode, setResolvedMode] = useState<'sheet' | 'dialog'>(() =>
    resolveMode(mode, mobileBreakpoint),
  )
  useEffect(() => {
    if (mode !== 'auto') {
      setResolvedMode(mode)
      return
    }
    const onResize = () =>
      setResolvedMode(resolveMode('auto', mobileBreakpoint))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mode, mobileBreakpoint])

  const panelRef = useRef<HTMLDivElement>(null)

  // Focus the panel when it opens so keyboard users can immediately
  // Tab into the content or press Escape.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{ zIndex: 'var(--z-modal)' as unknown as number }}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel — fixed in place. Dismissed via backdrop, Escape, or back. */}
      <div
        ref={panelRef}
        className="modal-panel"
        data-mode={resolvedMode}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={{ zIndex: 'var(--z-modal)' as unknown as number }}
      >
        <div className="modal-body">{children}</div>
      </div>
    </>,
    document.body,
  )
}

function resolveMode(mode: ModalMode, breakpoint: number): 'sheet' | 'dialog' {
  if (mode !== 'auto') return mode
  if (typeof window === 'undefined') return 'dialog'
  return window.innerWidth < breakpoint ? 'sheet' : 'dialog'
}

export default Modal
