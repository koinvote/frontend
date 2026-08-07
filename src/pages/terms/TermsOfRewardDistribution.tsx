import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { setupAnchorFlash } from "@/utils/anchorFlash";

export default function TermsOfRewardDistribution() {
  const { t } = useTranslation();
  const params = useSystemParametersStore((s) => s.params);
  // Unset until the system parameters arrive, and unset for good if that
  // request fails. Falling back to 0 stated a minimum payout threshold of
  // 0 sats, which is not a threshold this platform has ever applied.
  const dustThresholdSat = params?.dust_threshold_satoshi ?? "--";

  const bold = <span className="font-bold" />;

  // The sections and the worked examples are long runs of prose that differ
  // only by key. Rendering them from key lists keeps the shape of each section
  // visible here, and means adding a sentence is a change to the locale files
  // alone.
  const paras = (keys: string[]) =>
    keys.map((key) => (
      <p key={key}>
        <Trans i18nKey={`rewardTerms.${key}`} components={{ bold }} />
      </p>
    ));

  const bullets = (keys: string[]) => (
    <ul className="list-disc pl-6 space-y-1">
      {keys.map((key) => (
        <li key={key}>
          <Trans i18nKey={`rewardTerms.${key}`} components={{ bold }} />
        </li>
      ))}
    </ul>
  );

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
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl fw-m text-center">
          {t("rewardTerms.title")}
        </h1>
        <p className="text-center text-secondary text-sm">
          {t("rewardTerms.lastUpdated")}
        </p>
      </div>

      <p className="text-secondary leading-relaxed">{t("rewardTerms.intro")}</p>

      <section>
        <ol className="list-decimal pl-6 marker:font-bold space-y-3">
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s1_title")}</h3>
            <div className="space-y-1 text-secondary">
              {paras(["s1_1", "s1_2", "s1_3", "s1_4"])}
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s2_title")}</h3>
            <div className="space-y-1 text-secondary">
              {paras(["s2_1", "s2_2", "s2_3"])}
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s3_title")}</h3>
            <div className="space-y-1 text-secondary">
              {paras(["s3_0", "s3_1", "s3_2", "s3_3", "s3_4", "s3_5", "s3_6"])}
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
              {paras(["s6_1", "s6_2"])}
            </div>
          </li>
          <li className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.s7_title")}</h3>
            <div className="space-y-1 text-secondary">
              {paras(["s7_1", "s7_2", "s7_3"])}
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
              {paras(["ex1_total_reward", "ex1_winners", "ex1_score_block"])}

              <p>{t("rewardTerms.ex1_participants_label")}</p>
              {bullets([
                "ex1_participant_a",
                "ex1_participant_b",
                "ex1_participant_c",
                "ex1_total_score",
              ])}

              <p>{t("rewardTerms.ex1_selection_label")}</p>
              {bullets([
                "ex1_selection_seed",
                "ex1_selection_1",
                "ex1_selection_2",
              ])}

              <p>{t("rewardTerms.ex1_distribution_label")}</p>
              {bullets([
                "ex1_distribution_fee",
                "ex1_distribution_net",
                "ex1_distribution_a",
                "ex1_distribution_b",
                "ex1_distribution_remainder",
              ])}

              <p>{t("rewardTerms.ex1_final_label")}</p>
              {bullets(["ex1_final_a", "ex1_final_b"])}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold">{t("rewardTerms.ex2_title")}</h3>
            <div className="space-y-1 text-secondary">
              {paras([
                "ex2_total_reward",
                "ex2_winners",
                "ex2_platform_fee",
                "ex2_transaction_fee",
                "ex2_min_threshold",
                "ex2_net_reward",
              ])}

              <p>{t("rewardTerms.ex2_participants_label")}</p>
              {bullets([
                "ex2_participant_a",
                "ex2_participant_b",
                "ex2_participant_d",
                "ex2_participant_c",
                "ex2_total_score",
              ])}

              <p>{t("rewardTerms.ex2_selection_label")}</p>
              {bullets(["ex2_selection_1"])}

              <p>{t("rewardTerms.ex2_steps_label")}</p>
              <ol className="list-decimal pl-6 marker:font-bold space-y-1">
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_step1_label")}
                  </p>
                  {bullets([
                    "ex2_step1_a",
                    "ex2_step1_b",
                    "ex2_step1_c",
                    "ex2_step1_total",
                  ])}
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_step2_label")}
                  </p>
                  {bullets([
                    "ex2_step2_a",
                    "ex2_step2_b",
                    "ex2_step2_remainder",
                  ])}
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_step3_label")}
                  </p>
                  {bullets(["ex2_step3_1", "ex2_step3_2"])}
                </li>
                <li className="space-y-1">
                  <p className="font-bold">
                    {t("rewardTerms.ex2_final_label")}
                  </p>
                  {bullets([
                    "ex2_final_a",
                    "ex2_final_b",
                    "ex2_final_c",
                    "ex2_final_d",
                  ])}
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
