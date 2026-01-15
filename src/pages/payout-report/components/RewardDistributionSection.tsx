import { API } from "@/api";
import type { RewardDetail } from "@/api/response";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VerificationInfo } from "./VerificationInfo";
import { WinnerTable } from "./WinnerTable";

interface RewardDistributionSectionProps {
  detail: RewardDetail;
  eventId: string;
  index: number;
}

export function RewardDistributionSection({
  detail,
  eventId,
  index,
}: RewardDistributionSectionProps) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const isOriginal = detail.reward_type === "initial";
  const titleKey = isOriginal
    ? "payoutReport.originalDistribution"
    : "payoutReport.additionalDistribution";
  const titleKeyDefaultText = isOriginal
    ? "Original Reward Distribution"
    : "Additional Reward Distribution";

  const title = isOriginal
    ? t(titleKey, titleKeyDefaultText)
    : `${t(titleKey, titleKeyDefaultText)} #${index}`;

  const summaryItems = [
    {
      label: t("payoutReport.reward", "Reward"),
      value: `${detail.original_amount_satoshi.toLocaleString()} sats`,
    },
    {
      label: `${t("payoutReport.serviceFee", "Service fee")} (2%)`,
      value: `-${detail.platform_fee_satoshi.toLocaleString()} sats`,
      negative: true,
    },
    {
      label: t("payoutReport.transactionFee", "Transaction fee"),
      value: `-${detail.estimated_miner_fee_satoshi.toLocaleString()} sats`,
      negative: true,
    },
    {
      label: t("payoutReport.netReward", "Net reward to be distributed"),
      value: `${detail.distributable_satoshi.toLocaleString()} sats`,
      highlight: true,
    },
    {
      label: t(
        "payoutReport.numberOfWinningAddress",
        "Number of winning addresses"
      ),
      value: detail.winner_count.toString(),
    },
  ];

  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    try {
      const blob = await API.getVerificationCsv(eventId, detail.plan_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payout_verification_${eventId}_${detail.plan_id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="p-0 md:p-6 md:rounded-2xl md:border border-neutral-800 overflow-hidden">
        {/* Header */}
        <h3 className="mb-6 text-base text-primary">{title}</h3>

        {/* Summary grid */}
        <div className="px-4 pt-4 pb-6 bg-gray-100 dark:bg-transparent rounded-lg">
          <div className="flex flex-wrap -mx-2">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className="w-1/2 md:w-1/5 px-2 mb-4 md:mb-0 flex flex-col"
              >
                <p className="text-base text-gray-400 mb-1 flex-1">
                  {item.label}
                </p>
                <p
                  className={`text-base ${
                    item.highlight
                      ? "text-emerald-500 font-bold"
                      : item.negative
                      ? "text-red-900"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Winner Table */}
        <h4 className="text-base text-primary mt-6 mb-4">
          {t("payoutReport.winningDetails", "Winning Details")}
        </h4>
        <WinnerTable
          winners={detail.winners}
          winnerCount={detail.winner_count}
          eventId={eventId}
        />

        {/* Verification Info */}
        <VerificationInfo
          eventId={eventId}
          planId={detail.plan_id}
          batchTransferTxid={detail.batch_transfer_txid}
          csvSha256={detail.csv_sha256}
          isDownloading={isDownloading}
          onDownloadCsv={handleDownloadCsv}
        />
      </div>
    </div>
  );
}
