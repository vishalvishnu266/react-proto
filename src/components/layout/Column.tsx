import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { toCssLength, type Align, type Gap, type Justify } from './types'
import './layout.css'

/**
 * Vertical flex container.
 *
 * Replaces:
 *   <div className="flex flex-col items-start gap-2"> … </div>
 * with:
 *   <Column align="start" gap={8}> … </Column>
 *
 * `Stack` is exported as an alias — use whichever reads better at the
 * call site ("stack of items" vs "column layout").
 */
export interface ColumnProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  /** Cross-axis alignment (align-items). Default: `stretch`. */
  align?: Align
  /** Main-axis distribution (justify-content). Default: `start`. */
  justify?: Justify
  /** Space between children. Number = pixels, string = any CSS length. */
  gap?: Gap
}

export function Column({
  children,
  align,
  justify,
  gap,
  className = '',
  style,
  ...rest
}: ColumnProps) {
  const mergedStyle: CSSProperties = {
    gap: toCssLength(gap),
    ...style,
  }

  const classes = [
    'l-col',
    align ? `l-align-${align}` : '',
    justify ? `l-justify-${justify}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div {...rest} className={classes} style={mergedStyle}>
      {children}
    </div>
  )
}

/*
 * Intent-named presets.
 *
 *   <Column.Center>       centered on both axes
 *   <Column.Between>      first/last pushed to ends, cross-axis centered
 *   <Column.End>          push children to the bottom
 *   <Column.Start>        push children to the top (default)
 *
 * Any preset value can still be overridden by passing the prop explicitly.
 */

/** Centered on both axes. */
function ColumnCenter(props: ColumnProps) {
  return <Column align="center" justify="center" {...props} />
}
/** `justify: space-between` with cross-axis `center`. */
function ColumnBetween(props: ColumnProps) {
  return <Column align="center" justify="between" {...props} />
}
/** Push children to the bottom. */
function ColumnEnd(props: ColumnProps) {
  return <Column align="stretch" justify="end" {...props} />
}
/** Push children to the top. Same as bare `<Column>`. */
function ColumnStart(props: ColumnProps) {
  return <Column align="stretch" justify="start" {...props} />
}

Column.Center = ColumnCenter
Column.Between = ColumnBetween
Column.End = ColumnEnd
Column.Start = ColumnStart

/**
 * Semantic alias — reads nicely as "a vertical stack of things".
 * Presets are shared with `Column` (e.g. `Stack.Center` === `Column.Center`).
 */
export const Stack = Column

export default Column
