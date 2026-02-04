import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();
  const bold = <span className="font-bold" />;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary px-2 md:px-0">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t("terms.title")}
      </h1>

      <section>
        <ol className="list-decimal pl-6 marker:font-bold space-y-3">
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s1_title")}</h3>
            <p className="text-secondary leading-relaxed">
              <Trans i18nKey="terms.s1_text" components={{ bold }} />
            </p>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s2_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="terms.s2_p1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s2_p2" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s2_p3" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s2_types_intro" components={{ bold }} />
              </p>
              <ol className="list-decimal pl-6 marker:font-bold space-y-1">
                <li>
                  <Trans i18nKey="terms.s2_type_1" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s2_type_2" components={{ bold }} />
                </li>
              </ol>
              <p>
                <Trans
                  i18nKey="terms.s2_visibility_intro"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="terms.s2_visibility_intro2"
                  components={{ bold }}
                />
              </p>
              <ol className="list-decimal pl-6 marker:font-bold space-y-1">
                <li>
                  <Trans
                    i18nKey="terms.s2_visibility_1"
                    components={{ bold }}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="terms.s2_visibility_2"
                    components={{ bold }}
                  />
                </li>
              </ol>
              <div className="space-y-1 pt-2">
                <p className="font-bold text-primary">
                  {t("terms.s2_paid_title")}
                </p>
                <p>
                  <Trans i18nKey="terms.s2_paid_p1" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="terms.s2_paid_p2" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="terms.s2_paid_p3" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="terms.s2_paid_p4" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="terms.s2_paid_p5" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="terms.s2_paid_p6" components={{ bold }} />
                </p>
              </div>
              <div className="space-y-1 pt-2">
                <p className="font-bold text-primary">
                  {t("terms.s2_creator_title")}
                </p>
                <p>
                  <Trans i18nKey="terms.s2_creator_p1" components={{ bold }} />
                </p>
                <p>
                  <Trans i18nKey="terms.s2_creator_p2" components={{ bold }} />
                </p>
              </div>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s3_title")}</h3>
            <p className="text-secondary leading-relaxed">
              <Trans i18nKey="terms.s3_text" components={{ bold }} />
            </p>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s4_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="terms.s4_p1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s4_p2" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s5_title")}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="terms.s5_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s5_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s5_3" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s5_4" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s5_5" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s5_6" components={{ bold }} />
              </li>
            </ul>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s6_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="terms.s6_p1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s6_p2" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s6_p3" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s7_title")}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="terms.s7_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s7_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s7_3" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s7_4" components={{ bold }} />
              </li>
            </ul>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s8_title")}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="terms.s8_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s8_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s8_3" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s8_4" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s8_5" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s8_6" components={{ bold }} />
              </li>
            </ul>
            <div className="space-y-1 text-secondary pt-2">
              <p>
                <Trans i18nKey="terms.s8_content_p1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s8_content_p2" components={{ bold }} />
              </p>
              <p>
                <Trans
                  i18nKey="terms.s8_content_list_intro"
                  components={{ bold }}
                />
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <Trans i18nKey="terms.s8_content_li1" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li2" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li3" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li4" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li5" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li6" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li7" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="terms.s8_content_li8" components={{ bold }} />
                </li>
              </ul>
              <p>
                <Trans i18nKey="terms.s8_content_p3" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="terms.s8_content_p4" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("terms.s9_title")}</h3>
            <ul className="list-disc pl-6 space-y-1 text-secondary">
              <li>
                <Trans i18nKey="terms.s9_1" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s9_2" components={{ bold }} />
              </li>
              <li>
                <Trans i18nKey="terms.s9_3" components={{ bold }} />
              </li>
            </ul>
          </li>
        </ol>
      </section>
    </div>
  );
}
