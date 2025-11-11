import { useTranslation } from 'react-i18next'

export default function ChargesnRefunds() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary">
      <h1 className="text-2xl md:text-3xl fw-m text-center text-primary">
        {t('charges.title')}
      </h1>

      <section>
        <h2 className="fw-m mb-2">{t('charges.section1Title')}</h2>

        <div className="space-y-4">
          <div>
            <h3 className="fw-m">{t('charges.s1_1_title')}</h3>
            <p>{t('charges.s1_1_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s1_2_title')}</h3>
            <p>{t('charges.s1_2_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s1_3_title')}</h3>
            <p>{t('charges.s1_3_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s1_4_title')}</h3>
            <p>{t('charges.s1_4_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s1_5_title')}</h3>
            <p>{t('charges.s1_5_text')}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('charges.section2Title')}</h2>

        <div className="space-y-4">
          <div>
            <h3 className="fw-m">{t('charges.s2_1_title')}</h3>
            <p>{t('charges.s2_1_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s2_2_title')}</h3>
            <p>{t('charges.s2_2_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s2_3_title')}</h3>
            <p>{t('charges.s2_3_text')}</p>
          </div>

          <div>
            <h3 className="fw-m">{t('charges.s2_4_title')}</h3>
            <p>{t('charges.s2_4_text')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
