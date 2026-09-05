import './layout.css'

/**
 * Flexible spacer.
 *
 * Grows to fill remaining space inside a `<Row>` or `<Column>`. Useful
 * for pushing siblings to the far end without touching `justify`.
 *
 *   <Row align="center">
 *     <Logo />
 *     <Spacer />
 *     <UserMenu />
 *   </Row>
 */
export function Spacer() {
  return <div className="l-spacer" aria-hidden="true" />
}

export default Spacer
