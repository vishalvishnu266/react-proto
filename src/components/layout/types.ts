/*
 * Shared prop types for the layout primitives.
 *
 * Kept in a separate file so `Row`, `Column`, and `Grid` can share the
 * exact same alignment vocabulary without importing from each other.
 */

export type Align =
  | 'start'
  | 'center'
  | 'end'
  | 'stretch'
  | 'baseline'

export type Justify =
  | 'start'
  | 'center'
  | 'end'
  | 'between'
  | 'around'
  | 'evenly'

/**
 * Gap can be either a number (interpreted as px) or any valid CSS
 * length (e.g. `"1rem"`, `"0.5em"`, `"var(--space-2)"`).
 */
export type Gap = number | string

/**
 * Coerce a `Gap` value to a CSS length string.
 * Numbers are treated as pixels — matching the intuition that most
 * design systems specify spacing in whole-pixel steps.
 */
export function toCssLength(g: Gap | undefined): string | undefined {
  if (g == null) return undefined
  return typeof g === 'number' ? `${g}px` : g
}
