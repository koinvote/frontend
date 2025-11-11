import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl fw-m text-center">{t('about.title')}</h1>

      <p className="fw-m lg:tx-16">
        {t('about.introBold')}
      </p>

      <p className="text-secondary leading-relaxed lg:tx-16">
        {t('about.intro')}
      </p>

      <section>
        <h2 className="text-xl fw-m mb-2">{t('about.featuresTitle')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1 lg:tx-16">
          <li><strong>{t('about.feature1Title')}</strong>{t('about.feature1')}</li>
          <li><strong>{t('about.feature2Title')}</strong>{t('about.feature2')}</li>
          <li><strong>{t('about.feature3Title')}</strong>{t('about.feature3')}</li>
          <li><strong>{t('about.feature4Title')}</strong>{t('about.feature4')}</li>
        </ul>
      </section>

      <p className="fw-m lg:tx-16">
        {t('about.outro')}
      </p>
    </div>
  )
}
