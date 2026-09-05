import type { HTMLAttributes, ReactNode } from 'react'
import { useSwipe, type SwipeEvent } from './useSwipe'
import './Card.css'

/**
 * Simple content card.
 *
 * Intentionally minimal — it only provides the outer container
 * (background, border, rounded corners, padding, shadow, hover lift).
 * All content is composed via `children`.
 *
 * Optional gestures:
 *   Pass any of `onSwipeLeft` / `onSwipeRight` / `onSwipeUp` / `onSwipeDown`
 *   to react to swipe gestures. Works with touch, mouse, and pen input
 *   via the unified PointerEvents API. When any swipe callback is set,
 *   the card becomes "draggable-feeling" (cursor changes, text selection
 *   is suppressed during the drag). The card stays a plain container
 *   when no swipe callback is passed.
 *
 * Styling uses only semantic tokens (`bg-surface`, `border-subtle`)
 * so the card re-themes automatically from `src/styles/`.
 * Component-specific CSS (shadow, hover lift, swipe cursor) lives in
 * `Card.css`.
 *
 * Example:
 *   <Card onSwipeLeft={() => dismiss()}>
 *     <h3 className="font-semibold">Swipe me left to dismiss</h3>
 *   </Card>
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  onSwipeLeft?: (e: SwipeEvent) => void
  onSwipeRight?: (e: SwipeEvent) => void
  onSwipeUp?: (e: SwipeEvent) => void
  onSwipeDown?: (e: SwipeEvent) => void
  /** Minimum swipe distance in px. Default 40. */
  swipeThreshold?: number
}

export function Card({
  children,
  className = '',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold,
  ...rest
}: CardProps) {
  const hasSwipe = Boolean(
    onSwipeLeft || onSwipeRight || onSwipeUp || onSwipeDown,
  )

  const swipeHandlers = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold: swipeThreshold,
  })

  return (
    <div
      {...rest}
      {...(hasSwipe ? swipeHandlers : {})}
      className={
        'card-root rounded-xl border border-subtle bg-surface p-4 ' +
        (hasSwipe ? 'card-swipeable ' : '') +
        className
      }
    >
      {children}
    </div>
  )
}

export default Card
