import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import '../i18n'
import { ThemeProvider } from '../theme'
import { BottomNav } from '../components/BottomNav'
import T from '../tKeys'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { t } = useTranslation()

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-surface text-default transition-colors duration-300">
        {/* Top bar (title only on mobile — nav lives at the bottom) */}
        <header className="p-4 border-b border-subtle">
          <h1 className="font-bold text-xl">{t(T.welcome)}</h1>
        </header>

        {/* Main content — pad bottom so content isn't hidden behind the
            fixed bottom nav (bar height + iOS safe-area inset). */}
        <main
          className="flex-1 p-6"
          style={{
            paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </ThemeProvider>
  )
}
