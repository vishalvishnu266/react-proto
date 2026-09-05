import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import T from '../tKeys'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">{t(T.contact.title)}</h2>
      <p className="text-muted">{t(T.contact.body)}</p>
      <ul className="text-muted list-disc list-inside">
        <li>
          <span className="font-medium">{t(T.contact.email)}:</span>{' '}
          hello@example.com
        </li>
      </ul>
    </div>
  )
}
