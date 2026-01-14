import type { PayoutStatus, PayoutWinner } from "@/api/response";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { truncateAddress } from "@/utils/address";
import { satsToBtc } from "@/utils/formatter";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface WinnerTableProps {
  winners: PayoutWinner[];
  winnerCount: number;
  eventId: string;
}

const DISPLAY_LIMIT = 10;

export function WinnerTable({ winners, winnerCount }: WinnerTableProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { params } = useSystemParametersStore();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const displayedWinners = winners.slice(0, DISPLAY_LIMIT);
  const shouldShowRemaining = winnerCount > DISPLAY_LIMIT;
  const remainingCount = winnerCount - DISPLAY_LIMIT;

  // Calculate redistribute stats
  const redistributedWinners = winners.filter(
    (w) => w.payout_status === "dust_redistributed"
  );
  const distributedAddrCount = redistributedWinners.length;
  const distributedReward = redistributedWinners.reduce(
    (sum, w) => sum + w.reward_satoshi,
    0
  );
  const dustThreshold = params?.dust_threshold_satoshi
    ? params.dust_threshold_satoshi.toLocaleString()
    : "--";

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      showToast("success", "Address copied");
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      showToast("error", "Failed to copy");
    }
  };

  const getStatusBadgeColor = (status: PayoutStatus) => {
    switch (status) {
      case "completed":
        return "bg-amber-500 text-white"; // #FF8904
      case "dust_redistributed":
      case "redistribute":
        return "bg-neutral-800 text-white"; // #262626
      case "processing":
      case "failed":
      case "pending":
      default:
        return "bg-emerald-400 text-white"; // #05DF72
    }
  };

  const getStatusText = (status: PayoutStatus) => {
    switch (status) {
      case "completed":
        return t("payoutReport.status.completed", "Completed");
      case "dust_redistributed":
        return t("payoutReport.status.redistribute", "Redistribute");
      case "processing":
      case "failed":
      case "pending":
      default:
        return t("payoutReport.status.processing", "Processing");
    }
  };

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-neutral-800">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="sticky left-0 text-left py-3 px-2 text-xs font-medium z-10">
                {t("payoutReport.address", "Address")}
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium whitespace-nowrap">
                {t("payoutReport.snapshotBalance", "Snapshot Balance")}
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium whitespace-nowrap">
                {t("payoutReport.oddsOfWinning", "Odds of winning")}
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium whitespace-nowrap">
                {t("payoutReport.distributableRatio", "Distributable")}
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium whitespace-nowrap">
                {t("payoutReport.estimatedReward", "Estimated reward")}
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium whitespace-nowrap">
                {t("payoutReport.paidSats", "Paid (Sats)")}
              </th>
              <th className="text-center py-3 px-2 text-xs font-medium whitespace-nowrap">
                {t("payoutReport.state", "State")}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedWinners.map((winner, index) => (
              <tr
                key={index}
                className=" hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-neutral-800 last:border-0"
              >
                <td className="sticky hover:bg-gray-50 dark:hover:bg-gray-700 py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary">
                      {truncateAddress(winner.winner_address)}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(winner.winner_address)}
                      className="shrink-0 text-secondary hover:text-primary transition-colors"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-xs text-primary whitespace-nowrap">
                  {satsToBtc(winner.balance_at_snapshot_satoshi)} BTC
                </td>
                <td className="py-3 px-2 text-right text-xs text-primary whitespace-nowrap">
                  {winner.win_probability_percent.toFixed(4)}%
                </td>
                <td className="py-3 px-2 text-right text-xs text-primary whitespace-nowrap">
                  {winner.win_probability_percent.toFixed(4)}%
                </td>
                <td className="py-3 px-2 text-right text-xs font-medium text-primary whitespace-nowrap">
                  {winner.reward_satoshi.toLocaleString()} sats
                </td>
                <td className="py-3 px-2 text-right text-xs text-primary whitespace-nowrap">
                  {winner.reward_satoshi.toLocaleString()} sats
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(
                        winner.payout_status
                      )}`}
                    >
                      {getStatusText(winner.payout_status)}
                    </span>
                    {winner.payout_status === "dust_redistributed" && (
                      <Tooltip
                        className="bg-white text-black"
                        title={`${distributedAddrCount} addresses had bonuses below the minimum threshold (${dustThreshold} sats), for a total of ${distributedReward.toLocaleString()} sats redistributed to eligible addresses.`}
                      >
                        <InfoCircleOutlined className="text-secondary cursor-pointer" />
                      </Tooltip>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {/* Remaining count message - only show when winners > 10 */}
            {shouldShowRemaining && (
              <tr className="my-4 text-center">
                <td
                  className="p-4 text-center text-sm text-secondary"
                  colSpan={7}
                >
                  {t("payoutReport.moreAddresses", { count: remainingCount })}(
                  {t("payoutReport.downloadVerification")})
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
