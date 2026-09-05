import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Pencil, Share2, Trash2, MoreVertical } from 'lucide-react'
import { useAppStore } from '../store'
import { StatusPill } from '../components/StatusPill'
import Card from '../components/Card'
import { Menu } from '../components/Menu'
import T from '../tKeys'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { t } = useTranslation()
  const devMode = useAppStore((s) => s.devMode)

  // Demo state for the swipeable card below. We record the last gesture
  // so users can visibly confirm the callback fired.
  const [lastSwipe, setLastSwipe] = useState<string>('—')

  // Demo state for the Menu below. Records which action the user picked.
  const [lastAction, setLastAction] = useState<string>('—')

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{t(T.home.title)}</h2>
      <p className="text-muted">{t(T.home.intro)}</p>
      <p className="text-sm text-subtle">
        (Use the bottom nav bar to change theme and language from Settings.)
      </p>

      {/* Demonstrates reading a value from the global store in another
          component — flip "Dev mode" in Settings to see this pill update
          instantly, then reload the page (it persists via localStorage). */}
      <StatusPill active={devMode}>
        {devMode ? t(T.dev.on) : t(T.dev.off)}
      </StatusPill>

      {/*
       * Card + swipe demo.
       *
       * Try it on desktop by click-dragging horizontally, or on mobile
       * by swiping. The card only becomes "grabbable" because we passed
       * `onSwipeLeft` / `onSwipeRight` — without those props it stays
       * a plain container.
       */}
      <Card
        onSwipeLeft={(e) =>
          setLastSwipe(`⬅ left (${Math.round(e.distance)}px)`)
        }
        onSwipeRight={(e) =>
          setLastSwipe(`➡ right (${Math.round(e.distance)}px)`)
        }
      >
        <h3 className="font-semibold text-default">Swipe me</h3>
        <p className="mt-1 text-sm text-muted">
          Drag left or right (mouse or touch). The last gesture appears below.
        </p>
        <p className="mt-2 text-sm">
          Last swipe: <span className="text-primary font-medium">{lastSwipe}</span>
        </p>
      </Card>

      {/*
       * Menu demo. The action menu presents as a bottom sheet on mobile
       * (drag the handle down or tap outside to close) and a centered
       * dialog on desktop — same `<Modal>` shell as `<Select>`.
       */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-default">Menu demo</h3>
            <p className="text-sm text-muted mt-1">
              Last action:{' '}
              <span className="text-primary font-medium">{lastAction}</span>
            </p>
          </div>
          <Menu
            title="Post actions"
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <Pencil size={16} />,
                onSelect: () => setLastAction('Edit'),
              },
              {
                key: 'share',
                label: 'Share',
                icon: <Share2 size={16} />,
                hint: '⇧⌘S',
                onSelect: () => setLastAction('Share'),
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <Trash2 size={16} />,
                destructive: true,
                onSelect: () => setLastAction('Delete'),
              },
            ]}
            trigger={({ open, ref, id, isOpen }) => (
              <button
                ref={ref}
                id={id}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={open}
                className="p-2 rounded-lg hover:bg-surface-muted text-default"
                aria-label="Open menu"
              >
                <MoreVertical size={18} />
              </button>
            )}
          />
        </div>
      </Card>

      <nav className="flex gap-4">
        <Link to="/about" className="text-primary hover:underline">
          {t(T.home.goAbout)}
        </Link>
        <Link to="/contact" className="text-primary hover:underline">
          {t(T.home.goContact)}
        </Link>
      </nav>
    </div>
  )
}
