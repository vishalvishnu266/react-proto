import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import T from '../tKeys'
import Card from '../components/Card'
import Switch from '../components/Switch'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">{t(T.about.title)}</h2>
      <p className="text-muted">{t(T.about.body)}</p>
    </div>
  )
}
