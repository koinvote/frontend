import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useSystemParametersStore } from "@/stores/systemParametersStore";

export default function TermsOfRewardDistribution() {
  const { t } = useTranslation();
  const params = useSystemParametersStore((s) => s.params);
  const dustThresholdSat = params?.dust_threshold_satoshi || 0;

  const bold = <span className="font-bold" />;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:tx-16 lg:lh-27 text-primary px-2 md:px-0">
      <h1 className="text-2xl md:text-3xl fw-m text-center">
        {t("rewardTerms.title")}
      </h1>

      <p className="text-secondary leading-relaxed">
        <Trans i18nKey="rewardTerms.intro" components={{ bold }} />
      </p>

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
                  <Trans i18nKey="rewardTerms.s4_fee_1" components={{ bold }} />
                </li>
                <li>
                  <Trans i18nKey="rewardTerms.s4_fee_2" components={{ bold }} />
                </li>
              </ol>
              <p className="text-secondary">
                <Trans i18nKey="rewardTerms.s4_1" components={{ bold }} />
              </p>
            </div>
          </li>
          <li className="space-y-1">
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
        <p className="text-secondary mb-2">
          <Trans i18nKey="rewardTerms.examplesIntro" components={{ bold }} />
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.ex1_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans
                  i18nKey="rewardTerms.ex1_total_reward"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex1_winners"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex1_participants_label"
                  components={{ bold }}
                />
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex1_participant_a"
                    components={{ bold }}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex1_participant_b"
                    components={{ bold }}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex1_participant_c"
                    components={{ bold }}
                  />
                </li>
              </ul>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex1_selection_label"
                  components={{ bold }}
                />
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex1_selection_1"
                    components={{ bold }}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex1_selection_2"
                    components={{ bold }}
                  />
                </li>
              </ul>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex1_distribution_label"
                  components={{ bold }}
                />
              </p>
              <div className="space-y-1">
                <p>
                  <Trans
                    i18nKey="rewardTerms.ex1_distribution_1"
                    components={{ bold }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="rewardTerms.ex1_distribution_2"
                    components={{ bold }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="rewardTerms.ex1_distribution_3"
                    components={{ bold }}
                  />
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.ex2_title")}</h3>
            <div className="space-y-1 text-secondary">
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_total_reward"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_platform_fee"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_transaction_fee"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_min_threshold"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_net_reward"
                  components={{ bold }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_winners_label"
                  components={{ bold }}
                />
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex2_winner_a"
                    components={{ bold }}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex2_winner_b"
                    components={{ bold }}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="rewardTerms.ex2_winner_c"
                    components={{ bold }}
                  />
                </li>
              </ul>
              <p>
                <Trans
                  i18nKey="rewardTerms.ex2_steps_label"
                  components={{ bold }}
                />
              </p>
              <ol className="list-decimal pl-6 marker:font-bold space-y-1">
                <li className="space-y-1">
                  <p className="font-bold">
                    <Trans
                      i18nKey="rewardTerms.ex2_step1_label"
                      components={{ bold }}
                    />
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
                    <Trans
                      i18nKey="rewardTerms.ex2_step2_label"
                      components={{ bold }}
                    />
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step2_a"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step2_b"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step2_remainder"
                        components={{ bold }}
                      />
                    </li>
                  </ul>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    <Trans
                      i18nKey="rewardTerms.ex2_step3_label"
                      components={{ bold }}
                    />
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step3_1"
                        components={{ bold }}
                      />
                    </li>
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_step3_2"
                        components={{ bold }}
                      />
                    </li>
                  </ul>
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    <Trans
                      i18nKey="rewardTerms.ex2_final_label"
                      components={{ bold }}
                    />
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
                    <li>
                      <Trans
                        i18nKey="rewardTerms.ex2_final_c"
                        components={{ bold }}
                      />
                    </li>
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
