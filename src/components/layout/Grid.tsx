import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { toCssLength, type Align, type Gap, type Justify } from './types'
import './layout.css'

/**
 * CSS Grid container.
 *
 * Two ways to specify columns:
 *   - `cols={3}`                     → 3 equal columns (`repeat(3, 1fr)`)
 *   - `cols="200px 1fr auto"`        → any raw grid-template-columns value
 *
 * Rows can be sized the same way via `rows`. Gaps accept a number
 * (pixels) or any CSS length. `rowGap` / `colGap` override `gap` on
 * their axis when you need different spacing.
 *
 * Example — a header/content/footer layout:
 *   <Grid rows="auto 1fr auto" gap={16} style={{ minHeight: '100dvh' }}>
 *     <Header />
 *     <Main />
 *     <Footer />
 *   </Grid>
 */
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  /** Number of equal columns, OR a raw `grid-template-columns` value. */
  cols?: number | string
  /** Number of equal rows, OR a raw `grid-template-rows` value. */
  rows?: number | string
  /** Gap between rows AND columns. */
  gap?: Gap
  /** Row-only gap. Overrides `gap` on the row axis. */
  rowGap?: Gap
  /** Column-only gap. Overrides `gap` on the column axis. */
  colGap?: Gap
  /** Cross-axis alignment for grid items (align-items). */
  align?: Align
  /** Main-axis distribution for grid items (justify-items maps here). */
  justify?: Justify
}

function templateFrom(v: number | string | undefined): string | undefined {
  if (v == null) return undefined
  return typeof v === 'number' ? `repeat(${v}, minmax(0, 1fr))` : v
}

export function Grid({
  children,
  cols,
  rows,
  gap,
  rowGap,
  colGap,
  align,
  justify,
  className = '',
  style,
  ...rest
}: GridProps) {
  const mergedStyle: CSSProperties = {
    gridTemplateColumns: templateFrom(cols),
    gridTemplateRows: templateFrom(rows),
    gap: toCssLength(gap),
    rowGap: toCssLength(rowGap),
    columnGap: toCssLength(colGap),
    ...style,
  }

  const classes = [
    'l-grid',
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
 * Intent-named presets for the common "just give me N equal columns"
 * cases — so you don't need to remember whether it's `cols={2}` or
 * `columns={2}` or a template string.
 *
 *   <Grid.Two gap={16}>      2 equal columns
 *   <Grid.Three gap={16}>    3 equal columns
 *   <Grid.Four gap={16}>     4 equal columns
 *   <Grid.Auto min={200} gap={12}>   responsive auto-fit grid
 *
 * The base `<Grid>` remains available for custom column templates
 * (e.g. `cols="2fr 1fr"` for weighted layouts).
 */

/** Two equal columns. */
function GridTwo(props: Omit<GridProps, 'cols'>) {
  return <Grid cols={2} {...props} />
}
/** Three equal columns. */
function GridThree(props: Omit<GridProps, 'cols'>) {
  return <Grid cols={3} {...props} />
}
/** Four equal columns. */
function GridFour(props: Omit<GridProps, 'cols'>) {
  return <Grid cols={4} {...props} />
}

/**
 * Responsive auto-fit grid — fills as many columns as fit, each at
 * least `min` pixels wide. Great for card lists that reflow with
 * viewport width, without needing media queries.
 *
 *   <Grid.Auto min={220} gap={16}>{cards}</Grid.Auto>
 */
export interface GridAutoProps extends Omit<GridProps, 'cols'> {
  /** Minimum column width in pixels. Default 240. */
  min?: number
}
function GridAuto({ min = 240, ...props }: GridAutoProps) {
  return (
    <Grid
      cols={`repeat(auto-fit, minmax(${min}px, 1fr))`}
      {...props}
    />
  )
}

Grid.Two = GridTwo
Grid.Three = GridThree
Grid.Four = GridFour
Grid.Auto = GridAuto

export default Grid
