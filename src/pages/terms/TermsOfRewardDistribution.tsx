import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { setupAnchorFlash } from "@/utils/anchorFlash";

export default function TermsOfRewardDistribution() {
  const { t } = useTranslation();
  const params = useSystemParametersStore((s) => s.params);
  const dustThresholdSat = params?.dust_threshold_satoshi || 0;

  const bold = <span className="font-bold" />;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const cleanups = [setupAnchorFlash({ hash: "anchor1" })];
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary px-2 md:px-0">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t("rewardTerms.title")}
      </h1>

      <p className="text-secondary leading-relaxed">{t("rewardTerms.intro")}</p>

      <section>
        <ol className="list-decimal pl-6 marker:font-bold space-y-3">
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s1_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="rewardTerms.s1_1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s1_2" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s2_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="rewardTerms.s2_1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s2_2" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s2_3" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s3_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="rewardTerms.s3_1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s3_2" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s3_3" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s4_title")}</h3>
            <div className="space-y-1">
              <p className="text-secondary">
                <Trans i18nKey="rewardTerms.s4_0" components={{ bold }} />
              </p>
              <ol className="list-decimal pl-6 marker:font-bold space-y-1 text-secondary">
                <li>
                  <Link
                    to="/charges-refunds#anchor1"
                    className="underline"
                    target="_blank"
                  >
                    {t("rewardTerms.s4_fee_1", "Platform Service Fee")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/charges-refunds#anchor3"
                    className="underline"
                    target="_blank"
                  >
                    {t("rewardTerms.s4_fee_2", "Transaction Fee")}
                  </Link>
                </li>
              </ol>
              <p className="text-secondary">
                <Trans i18nKey="rewardTerms.s4_1" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1" id="anchor1">
            <h3 className="font-bold">{t("rewardTerms.s5_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans
                  i18nKey="rewardTerms.s5_1"
                  components={{ bold }}
                  values={{ dustThresholdSat }}
                />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s6_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="rewardTerms.s6_1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s6_2" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s7_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans i18nKey="rewardTerms.s7_1" components={{ bold }} />
              </p>
              <p>
                <Trans i18nKey="rewardTerms.s7_2" components={{ bold }} />
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl fw-m mb-2">{t("rewardTerms.examplesTitle")}</h2>
        <p className="text-secondary mb-2">{t("rewardTerms.examplesIntro")}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.ex1_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>{t("rewardTerms.ex1_total_reward")}</p>
              <p>{t("rewardTerms.ex1_winners")}</p>
              <p>{t("rewardTerms.ex1_participants_label")}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t("rewardTerms.ex1_participant_a")}</li>
                <li>{t("rewardTerms.ex1_participant_b")}</li>
                <li>{t("rewardTerms.ex1_participant_c")}</li>
              </ul>
              <p>{t("rewardTerms.ex1_selection_label")}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t("rewardTerms.ex1_selection_1")}</li>
                <li>{t("rewardTerms.ex1_selection_2")}</li>
              </ul>
              <p>{t("rewardTerms.ex1_distribution_label")}</p>
              <div className="space-y-1">
                <p>{t("rewardTerms.ex1_distribution_1")}</p>
                <p>{t("rewardTerms.ex1_distribution_2")}</p>
                <p>{t("rewardTerms.ex1_distribution_3")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.ex2_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>{t("rewardTerms.ex2_total_reward")}</p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_platform_fee"
                  components={{ bold }}
                />
              </p>
              <p>{t("rewardTerms.ex2_transaction_fee")}</p>
              <p>{t("rewardTerms.ex2_min_threshold")}</p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_net_reward"
                  components={{ bold }}
                />
              </p>
              <p>{t("rewardTerms.ex2_winners_label")}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t("rewardTerms.ex2_winner_a")}</li>
                <li>{t("rewardTerms.ex2_winner_b")}</li>
                <li>{t("rewardTerms.ex2_winner_c")}</li>
              </ul>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_total_holdings"
                  components={{ bold }}
                />
              </p>
              <p>{t("rewardTerms.ex2_steps_label")}</p>
              <ol className="list-decimal pl-6 marker:font-bold space-y-1">
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_step1_label")}
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step1_a"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step1_b"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step1_c"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step1_total"
                        components={{ bold }}
                      />
                    </li>
                  </ul>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_step2_label")}
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>{t("rewardTerms.ex2_step2_a")}</li>
                    <li>{t("rewardTerms.ex2_step2_b")}</li>
                    <li>{t("rewardTerms.ex2_step2_remainder")}</li>
                  </ul>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_step3_label")}
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>{t("rewardTerms.ex2_step3_1")}</li>
                    <li>{t("rewardTerms.ex2_step3_2")}</li>
                  </ul>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_final_label")}
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_final_a"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_final_b"
                        components={{ bold }}
                      />
                    </li>
                    <li>{t("rewardTerms.ex2_final_c")}</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
