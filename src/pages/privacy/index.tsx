import { Trans, useTranslation } from 'react-i18next'
import { useEffect } from 'react'

export default function Privacy() {
  const { t } = useTranslation()
  const bold = <span className="font-bold" />

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary px-2 md:px-0">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t('privacy.title')}
      </h1>

      <section>
        <h2 className="text-xl fw-m mb-2">{t('privacy.scopeTitle')}</h2>
        <div className="space-y-1 text-secondary">
          <p>
            <Trans i18nKey="privacy.scope_p1" components={{ bold }} />
          </p>
          <p>
            <Trans i18nKey="privacy.scope_p2" components={{ bold }} />
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl fw-m mb-2">{t('privacy.noticeTitle')}</h2>
        <div className="space-y-1 text-secondary">
          <p>
            <Trans i18nKey="privacy.notice_p1" components={{ bold }} />
          </p>
          <p>
            <Trans i18nKey="privacy.notice_p2" components={{ bold }} />
          </p>
        </div>
      </section>

      <section>
        <ol className="list-decimal pl-6 marker:font-bold space-y-3">
          <li className="space-y-1">
            <h3 className="font-bold">{t('privacy.section1Title')}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="privacy.s1_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s1_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s1_3" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s1_4" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s1_5" components={{ bold }} />
              </li>
            </ul>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t('privacy.section2Title')}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="privacy.s2_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s2_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s2_3" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s2_4" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s2_5" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s2_6" components={{ bold }} />
              </li>
            </ul>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t('privacy.section3Title')}</h3>
            <p className="text-secondary">
              <Trans i18nKey="privacy.s3_intro" components={{ bold }} />
            </p>
            <ol className="list-decimal pl-6 marker:font-bold space-y-2 text-secondary">
              <li className="space-y-1">
                <p className="font-bold">{t('privacy.s3_1_title')}</p>
                <p>
                  <Trans i18nKey="privacy.s3_1_p1" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="privacy.s3_1_p2" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="privacy.s3_1_p3" components={{ bold }} />
                </p>
              </li>
              <li className="space-y-1">
                <p className="font-bold">{t('privacy.s3_2_title')}</p>
                <p>
                  <Trans i18nKey="privacy.s3_2_p1" components={{ bold }} />
                </p>
              </li>
            </ol>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t('privacy.section4Title')}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="privacy.s4_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s4_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s4_3" components={{ bold }} />
              </li>
            </ul>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t('privacy.section5Title')}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="privacy.s5_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="privacy.s5_2" components={{ bold }} />
              </li>
            </ul>
          </li>
        </ol>
      </section>
    </div>
  )
}
