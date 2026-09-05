import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Home as HomeIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react'
import T from '../tKeys'

/**
 * Union of the dotted string paths under `T.nav.*` (e.g. `"nav.home"`).
 * Using the union means every nav item's `labelKey` stays type-checked
 * against real translation keys, without an `as any` cast at the `t()`
 * call site.
 */
type TranslationKey =
  | typeof T.nav.home
  | typeof T.nav.about
  | typeof T.nav.contact
  | typeof T.nav.settings

/**
 * Mobile-first bottom navigation bar.
 *
 * - Uses TanStack Router `<Link>` for navigation.
 * - Highlights the active tab via `activeProps` (colored icon + label +
 *   an accent bar above the tab).
 * - Uses lucide-react icons.
 * - Respects the iOS safe-area inset so the bar clears the home indicator.
 */

interface NavItem {
  to: string
  labelKey: TranslationKey
  Icon: LucideIcon
  /** Only mark active on exact match (used for the root "/" route). */
  exact?: boolean
}

// Typed via the shared `T` proxy so translation keys are compile-checked.
const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/', labelKey: T.nav.home, Icon: HomeIcon, exact: true },
  { to: '/about', labelKey: T.nav.about, Icon: InfoIcon },
  { to: '/contact', labelKey: T.nav.contact, Icon: MailIcon },
  { to: '/settings', labelKey: T.nav.settings, Icon: SettingsIcon },
]

// Style tokens — extracted so active/inactive states share layout classes
// and only differ in color/weight (prevents layout shift on tab change).
const BASE_ITEM =
  'relative flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors'
const INACTIVE_ITEM =
  BASE_ITEM + ' text-muted hover:text-default'
const ACTIVE_ITEM =
  BASE_ITEM +
  ' text-primary font-semibold' +
  " after:content-[''] after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2" +
  ' after:h-0.5 after:w-8 after:rounded-full after:bg-primary'

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-subtle bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, labelKey, Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: !!exact }}
              className={INACTIVE_ITEM}
              activeProps={{ className: ACTIVE_ITEM }}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
