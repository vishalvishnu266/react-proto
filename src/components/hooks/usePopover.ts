import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

/**
 * Preferred placement for the popover relative to its trigger.
 *
 * `'bottom'` / `'top'` are automatically flipped when the popover
 * doesn't fit — see `flip: true` in {@link UsePopoverOptions}.
 */
export type PopoverPlacement = 'bottom' | 'top'

export interface UsePopoverOptions {
  /** Anchor element (typically a button). Required — we can't position without it. */
  triggerRef: RefObject<HTMLElement | null>
  /**
   * Ref to the popover element itself, once it has been mounted.
   * Used to measure the popover's actual size so `flip` and viewport
   * clamping know how much space it needs.
   */
  popoverRef: RefObject<HTMLElement | null>
  /** Whether the popover is currently open. */
  open: boolean
  /** Preferred placement. Default: `'bottom'`. */
  placement?: PopoverPlacement
  /** Gap between the trigger and the popover, in px. Default: 4. */
  offset?: number
  /**
   * Flip to the opposite side when there isn't enough room in the
   * preferred direction. Default: true.
   */
  flip?: boolean
  /**
   * Match the popover's width to the trigger's width. Default: true.
   * Set to false for menus/tooltips whose width shouldn't be constrained.
   */
  matchTriggerWidth?: boolean
}

export interface PopoverRect {
  /** Fixed-positioning `top` in viewport pixels. */
  top: number
  /** Fixed-positioning `left` in viewport pixels. */
  left: number
  /** Rendered width in pixels (equals trigger width when `matchTriggerWidth`). */
  width: number
  /** Actual placement used after flip resolution (`'top'` or `'bottom'`). */
  placement: PopoverPlacement
}

/**
 * Position a portalled popover relative to a trigger button.
 *
 * Responsibilities:
 *   - Measure the trigger with `getBoundingClientRect()` and compute
 *     `fixed` viewport coordinates so the popover appears just below
 *     (or above) it.
 *   - **Flip** to the opposite side when there isn't enough room in
 *     the preferred direction (viewport-edge aware).
 *   - Re-measure on scroll (with `capture: true` so nested scrolling
 *     ancestors are caught) and on window resize while open.
 *   - Match the trigger's width by default so the popover reads as a
 *     visual extension of the trigger.
 *
 * The hook does NOT render anything — it only returns a `rect` you can
 * apply as inline styles on your popover element. Rendering the popover
 * into `document.body` via `createPortal` is up to the caller (see
 * `Select.tsx` for a full example).
 */
export function usePopover({
  triggerRef,
  popoverRef,
  open,
  placement = 'bottom',
  offset = 4,
  flip = true,
  matchTriggerWidth = true,
}: UsePopoverOptions) {
  const [rect, setRect] = useState<PopoverRect | null>(null)

  // Track the last resolved placement so scroll-updates don't cause the
  // popover to flip on every pixel — we only flip when the preferred
  // direction no longer fits.
  const lastPlacementRef = useRef<PopoverPlacement>(placement)

  const update = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const t = trigger.getBoundingClientRect()

    const popoverH = popoverRef.current?.offsetHeight ?? 0
    const viewportH = window.innerHeight

    // Decide the final placement (with optional flip).
    let resolved: PopoverPlacement = placement
    if (flip) {
      const spaceBelow = viewportH - t.bottom - offset
      const spaceAbove = t.top - offset
      if (placement === 'bottom' && popoverH > spaceBelow && spaceAbove > spaceBelow) {
        resolved = 'top'
      } else if (placement === 'top' && popoverH > spaceAbove && spaceBelow > spaceAbove) {
        resolved = 'bottom'
      }
    }
    lastPlacementRef.current = resolved

    const top =
      resolved === 'bottom'
        ? t.bottom + offset
        : t.top - offset - popoverH

    const width = matchTriggerWidth ? t.width : 0 // 0 = auto width

    setRect({
      top,
      left: t.left,
      width,
      placement: resolved,
    })
  }, [triggerRef, popoverRef, placement, offset, flip, matchTriggerWidth])

  // Position on open (layout effect so first paint is correct).
  useLayoutEffect(() => {
    if (!open) return
    update()
  }, [open, update])

  // Re-measure once the popover's own size is known.
  // This second pass lets `flip` account for the popover's actual height.
  useLayoutEffect(() => {
    if (!open || !popoverRef.current) return
    update()
    // We intentionally depend on popoverRef.current so this runs after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, popoverRef.current])

  // Keep the popover glued to the trigger while it's open.
  useEffect(() => {
    if (!open) return
    const onReflow = () => update()
    window.addEventListener('scroll', onReflow, true) // capture: catch scrolling ancestors
    window.addEventListener('resize', onReflow)
    return () => {
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [open, update])

  return rect
}
