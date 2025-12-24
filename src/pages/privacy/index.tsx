import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

export default function Privacy() {
  const { t } = useTranslation()

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t('privacy.title')}
      </h1>

      <section>
        <h2 className="fw-m mb-2">{t('privacy.noticeTitle')}</h2>
        <p className="text-secondary leading-relaxed">
          {t('privacy.notice')}
        </p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('privacy.section1Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li><strong>{t('privacy.s1_1_label')}</strong>{t('privacy.s1_1_text')}</li>
          <li><strong>{t('privacy.s1_2_label')}</strong>{t('privacy.s1_2_text')}</li>
          <li><strong>{t('privacy.s1_3_label')}</strong>{t('privacy.s1_3_text')}</li>
          <li><strong>{t('privacy.s1_4_label')}</strong>{t('privacy.s1_4_text')}</li>
          <li><strong>{t('privacy.s1_5_label')}</strong>{t('privacy.s1_5_text')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('privacy.section2Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('privacy.s2_1')}</li>
          <li>{t('privacy.s2_2')}</li>
          <li>{t('privacy.s2_3')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('privacy.section3Title')}</h2>
        <p className="text-secondary">{t('privacy.s3_intro')}</p>
        <ul className="list-disc list-inside text-secondary space-y-1 ml-4">
          <li>{t('privacy.s3_1')}</li>
          <li>{t('privacy.s3_2')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('privacy.section4Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('privacy.s4_1')}</li>
          <li>{t('privacy.s4_2')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('privacy.section5Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('privacy.s5_1')}</li>
          <li>{t('privacy.s5_2')}</li>
        </ul>
      </section>
    </div>
  )
}
