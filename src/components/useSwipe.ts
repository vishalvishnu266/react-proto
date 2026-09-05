import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/**
 * Direction of a completed swipe gesture.
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeEvent {
  direction: SwipeDirection
  /** Signed pixel distance along the primary axis (matches `direction`). */
  distance: number
  /** Signed pixel distance on the X axis (right positive). */
  deltaX: number
  /** Signed pixel distance on the Y axis (down positive). */
  deltaY: number
  /** Total gesture duration in milliseconds. */
  durationMs: number
}

export interface UseSwipeOptions {
  onSwipeLeft?: (e: SwipeEvent) => void
  onSwipeRight?: (e: SwipeEvent) => void
  onSwipeUp?: (e: SwipeEvent) => void
  onSwipeDown?: (e: SwipeEvent) => void
  /** Minimum distance in px to qualify as a swipe. Default 40. */
  threshold?: number
  /** Maximum gesture duration in ms to qualify as a swipe. Default 800. */
  maxDurationMs?: number
}

/**
 * Framework-free swipe detection for touch, mouse, and pen input via the
 * unified PointerEvents API.
 *
 * Returns handlers to spread onto any element. Purely additive — the
 * element behaves normally until a swipe is completed, at which point
 * the matching `onSwipe*` callback fires (only one direction per gesture).
 */
export function useSwipe(options: UseSwipeOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 40,
    maxDurationMs = 800,
  } = options

  // Track the active gesture. We keep it in a ref so re-renders don't
  // reset it and callbacks stay cheap.
  const start = useRef<
    | { x: number; y: number; t: number; pointerId: number }
    | null
  >(null)

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    // Only start tracking primary-button presses. Skip right-click, etc.
    if (e.button !== 0 && e.pointerType === 'mouse') return
    start.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      pointerId: e.pointerId,
    }
  }, [])

  const finish = useCallback(
    (endX: number, endY: number) => {
      const s = start.current
      if (!s) return
      start.current = null

      const deltaX = endX - s.x
      const deltaY = endY - s.y
      const durationMs = performance.now() - s.t
      if (durationMs > maxDurationMs) return

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Horizontal-dominant gesture
      if (absX > absY && absX >= threshold) {
        const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left'
        const event: SwipeEvent = {
          direction,
          distance: deltaX,
          deltaX,
          deltaY,
          durationMs,
        }
        ;(direction === 'right' ? onSwipeRight : onSwipeLeft)?.(event)
        return
      }

      // Vertical-dominant gesture
      if (absY >= threshold) {
        const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up'
        const event: SwipeEvent = {
          direction,
          distance: deltaY,
          deltaX,
          deltaY,
          durationMs,
        }
        ;(direction === 'down' ? onSwipeDown : onSwipeUp)?.(event)
      }
    },
    [maxDurationMs, threshold, onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (start.current?.pointerId !== e.pointerId) return
      finish(e.clientX, e.clientY)
    },
    [finish],
  )

  const onPointerCancel = useCallback((e: ReactPointerEvent) => {
    if (start.current?.pointerId === e.pointerId) start.current = null
  }, [])

  return { onPointerDown, onPointerUp, onPointerCancel }
}
