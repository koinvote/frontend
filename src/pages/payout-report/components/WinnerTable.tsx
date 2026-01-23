import type { PayoutStatus, PayoutWinner } from "@/api/response";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import { useSystemParametersStore } from "@/stores/systemParametersStore";
import { truncateAddress } from "@/utils/address";
import { satsToBtc } from "@/utils/formatter";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

interface WinnerTableProps {
  winners: PayoutWinner[];
  winnerCount: number;
  redistributedAddressCount: number;
  redistributedSatoshi: number;
  eventId: string;
}

const DISPLAY_LIMIT = 10;

export function WinnerTable({
  winners,
  winnerCount,
  redistributedAddressCount,
  redistributedSatoshi,
}: WinnerTableProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { params } = useSystemParametersStore();
  const [, setCopiedAddress] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollLeft > 0);
  }, []);

  const displayedWinners = winners.slice(0, DISPLAY_LIMIT);
  const shouldShowRemaining = winnerCount > DISPLAY_LIMIT;
  const remainingCount = winnerCount - DISPLAY_LIMIT;

  const dustThreshold = params?.dust_threshold_satoshi
    ? params.dust_threshold_satoshi.toLocaleString()
    : "--";

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      showToast("success", t("winnerTable.addressCopied", "Address copied"));
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      showToast("error", t("winnerTable.failedToCopy", "Failed to copy"));
    }
  };

  const getStatusBadgeColor = (status: PayoutStatus) => {
    switch (status) {
      case "completed":
        return "bg-amber-500 text-white"; // #FF8904
      case "dust_redistributed":
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
    <div className="rounded-xl border border-neutral-800 overflow-hidden">
      {/* 定義捲軸顏色 */}
      <div
        className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500"
        onScroll={handleScroll}
      >
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-neutral-800">
              <th
                className={`sticky left-0 bg-white dark:bg-black text-left py-3 px-2 text-xs font-medium z-10 transition-shadow ${
                  isScrolled
                    ? "shadow-[inset_-4px_0_4px_-4px_rgba(0,0,0,0.3)] dark:shadow-[inset_-4px_0_4px_-4px_rgba(255,255,255,0.3)]"
                    : ""
                }`}
              >
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
                className="group hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-neutral-800 last:border-0"
              >
                <td
                  className={`sticky left-0 bg-white dark:bg-black group-hover:bg-gray-50 dark:group-hover:bg-gray-800 py-3 px-2 z-10 transition-shadow ${
                    isScrolled
                      ? "shadow-[inset_-4px_0_4px_-4px_rgba(0,0,0,0.3)] dark:shadow-[inset_-4px_0_4px_-4px_rgba(255,255,255,0.3)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500 dark:text-primary">
                      {truncateAddress(winner.winner_address)}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(winner.winner_address)}
                      className="shrink-0 text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-xs text-gray-500 dark:text-primary whitespace-nowrap">
                  {satsToBtc(winner.balance_at_snapshot_satoshi)}
                </td>
                <td className="py-3 px-2 text-right text-xs text-gray-500 dark:text-primary whitespace-nowrap">
                  {winner.win_probability_percent.toFixed(4)}%
                </td>
                <td className="py-3 px-2 text-right text-xs text-gray-500 dark:text-primary whitespace-nowrap">
                  {winner.distributable_rate.toFixed(4)}%
                </td>
                <td className="py-3 px-2 text-right text-xs font-bold text-gray-500 dark:text-primary whitespace-nowrap">
                  {winner.original_reward_satoshi.toLocaleString()} sats
                </td>
                <td className="py-3 px-2 text-right text-xs font-bold text-gray-500 dark:text-primary whitespace-nowrap">
                  {winner.final_reward_satoshi.toLocaleString()} sats
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs whitespace-nowrap ${getStatusBadgeColor(
                        winner.status
                      )} ${
                        winner.status === "dust_redistributed" ? "ml-4" : ""
                      }`}
                    >
                      {getStatusText(winner.status)}
                    </span>
                    {winner.status === "dust_redistributed" && (
                      <Tooltip
                        className="bg-white text-black"
                        styles={{ root: { maxWidth: "min(700px, 90vw)" } }}
                        title={t(
                          "payoutReport.dustRedistributedTooltip",
                          "{{addressCount}} addresses had bonuses below the minimum threshold ({{threshold}} sats), for a total of {{totalSats}} sats redistributed to eligible addresses.",
                          {
                            addressCount: redistributedAddressCount,
                            threshold: dustThreshold,
                            totalSats: redistributedSatoshi.toLocaleString(),
                          }
                        )}
                      >
                        <InfoCircleOutlined className="text-gray-400 dark:text-primary cursor-pointer" />
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
                  className="p-4 text-center text-sm text-gray-400"
                  colSpan={7}
                >
                  {t(
                    "payoutReport.moreAddresses",
                    "There are {{count}} more addresses...",
                    { count: remainingCount }
                  )}
                  (
                  {t(
                    "payoutReport.downloadVerification",
                    "Please download the verification package to view the full list"
                  )}
                  )
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
