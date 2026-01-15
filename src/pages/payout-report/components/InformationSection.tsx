import type { PayoutReportRes } from "@/api/response";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { Divider } from "antd";
import { useTranslation } from "react-i18next";

interface InformationSectionProps {
  report: PayoutReportRes;
}

export function InformationSection({ report }: InformationSectionProps) {
  const { t } = useTranslation();
  const { params } = useSystemParametersStore();

  const infoItems = [
    { label: t("payoutReport.eventTitle"), value: report.event_title },
    { label: t("payoutReport.eventId"), value: report.event_id },
    {
      label: t("payoutReport.blockHigh"),
      value: report.snapshot_block_height.toLocaleString(),
    },
  ];

  const rewardItems = [
    {
      label: t("payoutReport.originalReward"),
      value: `${report.initial_reward_satoshi.toLocaleString()} sats`,
    },
    {
      label: `${t("payoutReport.additionalReward")} #1`,
      value: `${report.additional_reward_1_satoshi.toLocaleString()} sats`,
    },
    {
      label: `${t("payoutReport.additionalReward")} #2`,
      value: `${report.additional_reward_2_satoshi.toLocaleString()} sats`,
    },
    {
      label: t("payoutReport.totalReward"),
      value: `${report.total_reward_pool_satoshi.toLocaleString()} sats`,
      highlight: true,
    },
  ];

  return (
    <div className="rounded-2xl md:border border-neutral-800 md:p-6">
      <h2 className="text-base text-primary mt-12 mb-8 md:mt-0 md:mb-4">
        {t("payoutReport.information", "Information")}
      </h2>

      {/* Basic info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {infoItems.map((item, index) => (
          <div key={index}>
            <p className="text-base text-gray-400 mb-1">{item.label}</p>
            <p className="text-base text-primary wrap-break-word">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <Divider styles={{ root: { margin: "1rem 0" } }} />

      {/* Reward info grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {rewardItems.map((item, index) => (
          <div key={index}>
            <p className="text-base text-gray-400 mb-1">{item.label}</p>
            <p
              className={`text-base text-primary ${
                item.highlight ? "font-bold" : ""
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Reward threshold badge */}
      {params?.dust_threshold_satoshi && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-base text-gray-400">
            {t("payoutReport.rewardThreshold")}:
          </span>
          <span className="px-2 py-0.5 text-white text-xs bg-neutral-800 rounded-2xl">
            {params.dust_threshold_satoshi.toLocaleString()} sats
          </span>
        </div>
      )}
    </div>
  );
}
