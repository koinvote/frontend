import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { setupAnchorFlash } from "@/utils/anchorFlash";
import { satsToBtc } from "@/utils/formatter";

export default function ChargesnRefunds() {
  const { t } = useTranslation();
  const params = useSystemParametersStore((s) => s.params);

  const freeHours = params?.free_hours ?? 0;
  const satoshiPerDurationHour = params?.satoshi_per_duration_hour ?? 0;
  const platformFeePercentage = params?.platform_fee_percentage ?? 0;
  const btcPerDurationHour = satsToBtc(satoshiPerDurationHour);
  const bold = <span className="font-bold" />;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const cleanups = [
      setupAnchorFlash({ hash: "anchor1" }),
      setupAnchorFlash({ hash: "anchor2" }),
      setupAnchorFlash({ hash: "anchor3" }),
      setupAnchorFlash({ hash: "anchor4" }),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary px-2 md:px-0">
      <h1 className="text-2xl md:text-3xl fw-m text-center text-primary">
        {t("charges.title")}
      </h1>

      <section>
        <h2 className="text-xl fw-m mb-2">{t("charges.section1Title")}</h2>

        <div className="space-y-4">
          <ol className="list-decimal pl-6 marker:font-bold space-y-3">
            <li className="space-y-1" id="anchor1">
              <h3 className="font-bold">
                {t("charges.s1_1_title", "Platform Service Fee")}
              </h3>
              <ol className="list-[lower-alpha] pl-4 text-secondary marker:text-secondary">
                <li className="space-y-1">
                  <p className=" font-bold">{t("charges.s1_1_1_title")}</p>
                  <p>
                    <Trans
                      i18nKey="charges.s1_1_1_text"
                      values={{ platformFeePercentage }}
                      components={{ bold }}
                    />
                  </p>
                </li>
                <li className="space-y-1" id="anchor2">
                  <p className="font-bold">{t("charges.s1_1_2_title")}</p>
                  <p>
                    <Trans
                      i18nKey="charges.s1_1_2_text"
                      values={{ freeHours, btcPerDurationHour }}
                      components={{ bold }}
                    />
                  </p>
                </li>
              </ol>
            </li>
            <li className="space-y-1" id="anchor3">
              <h3 className="font-bold">{t("charges.s1_2_title")}</h3>
              <p className="text-secondary">{t("charges.s1_2_text")}</p>
            </li>
            <li className="space-y-1" id="anchor4">
              <h3 className="font-bold">{t("charges.s1_3_title")}</h3>
              <p className="text-secondary">{t("charges.s1_3_text1")}</p>
              <p className="text-secondary">
                <Trans i18nKey="charges.s1_3_text2" components={{ bold }} />
              </p>
            </li>
            <li className="space-y-1">
              <h3 className="font-bold">{t("charges.s1_4_title")}</h3>
              <p className="text-secondary">
                <Trans i18nKey="charges.s1_4_text1" components={{ bold }} />
              </p>
              <p className="text-secondary">
                <Trans i18nKey="charges.s1_4_text2" components={{ bold }} />
              </p>
              <p className="text-secondary">
                <Trans i18nKey="charges.s1_4_text3" components={{ bold }} />
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section>
        <h2 className="text-xl fw-m mb-2">{t("charges.section2Title")}</h2>

        <div className="space-y-4">
          <ol className="list-decimal pl-6 marker:font-bold space-y-3">
            <li className="space-y-1">
              <h3 className="font-bold">{t("charges.s2_1_title")}</h3>
              <p className="text-secondary">
                <Trans i18nKey="charges.s2_1_text" components={{ bold }} />
              </p>
              <ol className="list-[lower-alpha] pl-4 text-secondary marker:text-secondary">
                <li className="space-y-1">
                  <p className="font-bold">{t("charges.s2_1_1_title")}</p>
                  <p>{t("charges.s2_1_1_text")}</p>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">{t("charges.s2_1_2_title")}</p>
                  <p>
                    <Trans
                      i18nKey="charges.s2_1_2_text"
                      components={{ bold }}
                    />
                  </p>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">{t("charges.s2_1_3_title")}</p>
                  <p>
                    <Trans
                      i18nKey="charges.s2_1_3_text1"
                      components={{ bold }}
                    />
                  </p>
                  <p>
                    <Trans
                      i18nKey="charges.s2_1_3_text2"
                      components={{ bold }}
                    />
                  </p>
                </li>
              </ol>
            </li>
            <li className="space-y-1">
              <h3 className="font-bold">{t("charges.s2_2_title")}</h3>
              <p className="text-secondary">
                <Trans i18nKey="charges.s2_2_text" components={{ bold }} />
              </p>
            </li>
            <li className="space-y-1">
              <h3 className="font-bold">{t("charges.s2_3_title")}</h3>
              <p className="text-secondary">
                <Trans i18nKey="charges.s2_3_text1" components={{ bold }} />
              </p>
              <p className="text-secondary">
                <Trans i18nKey="charges.s2_3_text2" components={{ bold }} />
              </p>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
