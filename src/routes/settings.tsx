import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useTheme, type Theme } from '../theme'
import { appStore, useAppStore } from '../store'
import { SegmentedControl } from '../components/SegmentedControl'
import { Select } from '../components/Select'
import { Switch } from '../components/Switch'
import { Column, Row } from '../components/layout'
import Card from '../components/Card'
import T from '../tKeys'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

type Lang = 'en' | 'es' | 'ta'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-medium uppercase tracking-wide text-subtle">
      {children}
    </h3>
  )
}

/**
 * A small local helper that reads well as `<Section title="…">…</Section>`.
 * Wraps the section in a `<Card>` so each settings block gets the shared
 * surface + border + shadow styling. The heading sits inside the card
 * and the body is spaced with a `<Column gap={12}>`.
 */
function Section({
  title,
  children,
}: {
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <Column gap={12}>
        <SectionHeading>{title}</SectionHeading>
        {children}
      </Column>
    </Card>
  )
}

function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const devMode = useAppStore((s) => s.devMode)

  const themeOptions = [
    { value: 'light' as Theme, label: t(T.settings.themeLight) },
    { value: 'dark' as Theme, label: t(T.settings.themeDark) },
  ]

  const langOptions = [
    { value: 'en' as Lang, label: t(T.settings.languageEn) },
    { value: 'es' as Lang, label: t(T.settings.languageEs) },
    { value: 'ta' as Lang, label: t(T.settings.languageTa) },
  ]

  return (
    // Whole page — vertical stack of sections. `max-w-md` still lives
    // as a utility class since it's a width constraint, not layout.
    <Column gap={32} className="max-w-md">
      <h2 className="text-2xl font-semibold">{t(T.settings.title)}</h2>

      {/* Appearance / Theme */}
      <Section title={t(T.settings.appearance)}>
        <Column gap={8}>
          <span className="font-medium">{t(T.settings.theme)}</span>
      
          <Row.End gap={10}>
          <SegmentedControl<Theme>
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            ariaLabel={t(T.settings.theme)}
          />
          <SegmentedControl<Theme>
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            ariaLabel={t(T.settings.theme)}
          />

          </Row.End>
          <Row gap={5} justify='evenly'>
          <SegmentedControl<Theme>
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            ariaLabel={t(T.settings.theme)}
          />
          <SegmentedControl<Theme>
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            ariaLabel={t(T.settings.theme)}
          />
          </Row>
        </Column>
      </Section>

      {/* Language */}
      <Section title={t(T.settings.language)}>
        <label className="block">
          <span className="sr-only">{t(T.settings.language)}</span>
          <Select<Lang>
            value={i18n.language as Lang}
            onChange={(lang) => i18n.changeLanguage(lang)}
            options={langOptions}
          
          />
        </label>
      </Section>

      {/* Developer */}
      <Section title={t(T.settings.developer)}>
        <Switch
          checked={devMode}
          onChange={(v) => appStore.set({ devMode: v })}
          label={t(T.settings.devMode)}
          hint={t(T.settings.devModeHint)}
        />
      </Section>
    </Column>
  )
}
