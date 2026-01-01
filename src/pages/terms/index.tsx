import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

export default function Terms() {
  const { t } = useTranslation()

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 px-2 md:px-0">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t('terms.title')}
      </h1>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section1Title')}</h2>
        <p className="text-secondary leading-relaxed">{t('terms.s1')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section2Title')}</h2>
        <p className="text-secondary leading-relaxed">{t('terms.s2')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section3Title')}</h2>
        <p className="text-secondary leading-relaxed">{t('terms.s3')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section4Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('terms.s4_1')}</li>
          <li>{t('terms.s4_2')}</li>
          <li>{t('terms.s4_3')}</li>
          <li>{t('terms.s4_4')}</li>
          <li>{t('terms.s4_5')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section5Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('terms.s5_1')}</li>
          <li>{t('terms.s5_2')}</li>
          <li>{t('terms.s5_3')}</li>
          <li>{t('terms.s5_4')}</li>
          <li>{t('terms.s5_5')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section6Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('terms.s6_1')}</li>
          <li>{t('terms.s6_2')}</li>
          <li>{t('terms.s6_3')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section7Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('terms.s7_1')}</li>
          <li>{t('terms.s7_2')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('terms.section8Title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('terms.s8_1')}</li>
          <li>{t('terms.s8_2')}</li>
        </ul>
      </section>
    </div>
  )
}
