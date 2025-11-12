import { useTranslation } from 'react-i18next'

export default function TermsOfRewardDistribution() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t('rewardTerms.title')}
      </h1>

      <p className="text-secondary leading-relaxed">
        {t('rewardTerms.intro')}
      </p>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s1_title')}</h2>
        <p className="text-secondary">{t('rewardTerms.s1_1')}</p>
        <p className="text-secondary mt-2">{t('rewardTerms.s1_2')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s2_title')}</h2>
        <p className="text-secondary">{t('rewardTerms.s2_1')}</p>
        <p className="text-secondary mt-2">{t('rewardTerms.s2_2')}</p>
        <p className="text-secondary mt-2">{t('rewardTerms.s2_3')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s3_title')}</h2>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>{t('rewardTerms.s3_1')}</li>
          <li>{t('rewardTerms.s3_2')}</li>
          <li>{t('rewardTerms.s3_3')}</li>
        </ul>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s4_title')}</h2>
        <p className="text-secondary">{t('rewardTerms.s4_0')}</p>
        <ol className="list-decimal list-inside text-secondary space-y-1 mt-1">
          <li>{<span className="underline">{t('rewardTerms.s4_1')}</span>}</li>
          <li>{<span className="underline">{t('rewardTerms.s4_2')}</span>}</li>
        </ol>
        <p className="text-secondary mt-2">{t('rewardTerms.s4_3')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s5_title')}</h2>
        <p className="text-secondary">{t('rewardTerms.s5_1')} <span className="underline">{t('rewardTerms.s5_1_underline')}</span></p>
        <p className="text-secondary mt-2">{t('rewardTerms.s5_2')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s6_title')}</h2>
        <p className="text-secondary">{<span className="underline">{t('rewardTerms.s6_0_underline')}</span>} {t('rewardTerms.s6_1')}</p>
        <p className="text-secondary mt-2">{t('rewardTerms.s6_2')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.s7_title')}</h2>
        <p className="text-secondary">{t('rewardTerms.s7_1')}</p>
        <p className="text-secondary mt-2">{t('rewardTerms.s7_2')}</p>
      </section>

      <section>
        <h2 className="fw-m mb-2">{t('rewardTerms.examplesTitle')}</h2>

        <h3 className="fw-m">{t('rewardTerms.ex1_title')}</h3>
        <pre className="text-secondary whitespace-pre-wrap leading-relaxed">
{t('rewardTerms.ex1_block')}
        </pre>

        <h3 className="fw-m mt-4">{t('rewardTerms.ex2_title')}</h3>
        <pre className="text-secondary whitespace-pre-wrap leading-relaxed">
{t('rewardTerms.ex2_block')}
        </pre>
      </section>
    </div>
  )
}
