import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { toCssLength, type Align, type Gap, type Justify } from './types'
import './layout.css'

/**
 * Horizontal flex container.
 *
 * Replaces the common boilerplate:
 *   <div className="flex flex-row items-center justify-between gap-4"> … </div>
 * with:
 *   <Row align="center" justify="between" gap={16}> … </Row>
 *
 * Props are all optional so `<Row>` alone is a valid horizontal flexbox.
 * Falls through any standard `<div>` attributes (`id`, `onClick`, etc.).
 */
export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  /** Cross-axis alignment (align-items). Default: `stretch`. */
  align?: Align
  /** Main-axis distribution (justify-content). Default: `start`. */
  justify?: Justify
  /** Space between children. Number = pixels, string = any CSS length. */
  gap?: Gap
  /** Allow children to wrap onto multiple lines. Default: false. */
  wrap?: boolean
}

export function Row({
  children,
  align,
  justify,
  gap,
  wrap = false,
  className = '',
  style,
  ...rest
}: RowProps) {
  const mergedStyle: CSSProperties = {
    gap: toCssLength(gap),
    ...style,
  }

  const classes = [
    'l-row',
    align ? `l-align-${align}` : '',
    justify ? `l-justify-${justify}` : '',
    wrap ? 'l-wrap' : '',
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
 * Each preset is a thin wrapper around `<Row>` that pre-fills the
 * `align` and/or `justify` props for a common layout intent. Callers get
 * full autocomplete on `Row.` (thanks to the object namespace below)
 * and don't have to remember which alignment prop combinations mean what.
 *
 * You can still override any preset value by passing the prop explicitly.
 *
 *   <Row.Center gap={12}>       centered on both axes
 *   <Row.Between>               ends pushed apart, cross-axis stretched
 *   <Row.End>                   pushed to the right
 *   <Row.Start>                 pushed to the left (rarely needed — this is the default)
 *   <Row.Around>                even space around each child
 */

/** Aligned and justified centered on both axes. */
function RowCenter(props: RowProps) {
  return <Row align="center" justify="center" {...props} />
}
/** `justify: space-between` with cross-axis `center` — classic header row. */
function RowBetween(props: RowProps) {
  return <Row align="center" justify="between" {...props} />
}
/** Push children to the end of the main axis (right). */
function RowEnd(props: RowProps) {
  return <Row align="center" justify="end" {...props} />
}
/** Push children to the start of the main axis (left). Same as default `<Row>`. */
function RowStart(props: RowProps) {
  return <Row align="center" justify="start" {...props} />
}
/** Even space around each child. */
function RowAround(props: RowProps) {
  return <Row align="center" justify="around" {...props} />
}

// Attach the presets so callers can write `<Row.Center>` and get
// autocomplete for all variants after typing `Row.`.
Row.Center = RowCenter
Row.Between = RowBetween
Row.End = RowEnd
Row.Start = RowStart
Row.Around = RowAround

export default Row
