import { useEffect, useRef } from 'react'

export interface UseModalOptions {
  open: boolean
  onClose: () => void
  /** Close when the user presses Escape. Default: true. */
  closeOnEscape?: boolean
  /** Lock body scroll while the modal is open. Default: true. */
  lockBodyScroll?: boolean
  /**
   * Close when the user presses the browser/Android back button (or
   * performs a back gesture). Default: true.
   *
   * Implementation: pushes a placeholder `history.state` entry on open
   * and listens for `popstate`. When the user goes back, we intercept
   * the event and call `onClose` instead of letting the page navigate
   * away. On close, we pop our placeholder entry so the browser history
   * doesn't accumulate cruft.
   */
  closeOnBack?: boolean
}

/**
 * State-management helper for modal-style overlays.
 *
 * Responsibilities:
 *   - Lock `document.body` scroll while open (prevents the page from
 *     scrolling behind the modal on mobile / when the modal is tall).
 *   - Listen for `Escape` and invoke `onClose`.
 *   - Wire the browser/Android back button to invoke `onClose` instead
 *     of navigating the page.
 *
 * Rendering (backdrop, panel, portal, focus trap) is up to the caller
 * — see `Modal.tsx` for the full presentation layer.
 */
export function useModal({
  open,
  onClose,
  closeOnEscape = true,
  lockBodyScroll = true,
  closeOnBack = true,
}: UseModalOptions) {
  // Body scroll lock.
  useEffect(() => {
    if (!open || !lockBodyScroll) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, lockBodyScroll])

  // Escape-to-close.
  useEffect(() => {
    if (!open || !closeOnEscape) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeOnEscape, onClose])

  // Back-button-to-close.
  //
  // Push a placeholder history entry when the modal opens. When the
  // user hits Back, `popstate` fires — we invoke `onClose` and don't
  // push the placeholder back. When the user closes the modal by any
  // OTHER means (backdrop tap, Escape, external state change), we pop
  // our placeholder entry ourselves so history stays clean.
  //
  // The `pushedRef` guard prevents double-pushing (e.g. StrictMode
  // double-invocation in development) and lets the cleanup know
  // whether it should perform the compensating pop.
  const pushedRef = useRef(false)
  useEffect(() => {
    if (!open || !closeOnBack) return

    window.history.pushState({ __modal: true }, '')
    pushedRef.current = true

    const onPop = () => {
      // Either the user navigated back OR our cleanup popped our
      // placeholder — either way it's gone; don't try to pop again.
      pushedRef.current = false
      onClose()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      // Modal was closed by means other than a back nav — pop our
      // placeholder so the history stack stays clean.
      if (pushedRef.current) {
        pushedRef.current = false
        window.history.back()
      }
    }
  }, [open, closeOnBack, onClose])
}
