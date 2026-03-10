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
      case "redistribute":
        return "bg-neutral-800 text-white"; // #262626
      case "processing":
      default:
        return "bg-emerald-400 text-white"; // #05DF72
    }
  };

  const getStatusText = (status: PayoutStatus) => {
    switch (status) {
      case "completed":
        return t("payoutReport.status.completed", "Completed");
      case "redistribute":
        return t("payoutReport.status.redistribute", "Redistribute");
      case "processing":
      default:
        return t("payoutReport.status.processing", "Processing");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800">
      {/* 定義捲軸顏色 */}
      <div
        className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500 [&::-webkit-scrollbar-track]:bg-transparent"
        onScroll={handleScroll}
      >
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th
                className={`sticky left-0 z-10 bg-white px-2 py-3 text-left text-xs font-medium transition-shadow dark:bg-black ${
                  isScrolled
                    ? "shadow-[inset_-4px_0_4px_-4px_rgba(0,0,0,0.3)] dark:shadow-[inset_-4px_0_4px_-4px_rgba(255,255,255,0.3)]"
                    : ""
                }`}
              >
                {t("payoutReport.address", "Address")}
              </th>
              <th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap">
                {t("payoutReport.snapshotBalance", "Snapshot Balance")}
              </th>
              <th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap">
                {t("payoutReport.oddsOfWinning", "Odds of winning")}
              </th>
              <th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap">
                {t("payoutReport.distributableRatio", "Distributable")}
              </th>
              <th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap">
                {t("payoutReport.estimatedReward", "Estimated reward")}
              </th>
              <th className="px-2 py-3 text-right text-xs font-medium whitespace-nowrap">
                {t("payoutReport.paidSats", "Paid (Sats)")}
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap">
                {t("payoutReport.state", "State")}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedWinners.map((winner, index) => (
              <tr
                key={index}
                className="group border-b border-neutral-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td
                  className={`sticky left-0 z-10 bg-white px-2 py-3 transition-shadow group-hover:bg-gray-50 dark:bg-black dark:group-hover:bg-gray-800 ${
                    isScrolled
                      ? "shadow-[inset_-4px_0_4px_-4px_rgba(0,0,0,0.3)] dark:shadow-[inset_-4px_0_4px_-4px_rgba(255,255,255,0.3)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="dark:text-primary font-mono text-xs text-gray-500">
                      {truncateAddress(winner.winner_address)}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(winner.winner_address)}
                      className="text-secondary hover:text-primary shrink-0 cursor-pointer transition-colors"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="dark:text-primary px-2 py-3 text-right text-xs whitespace-nowrap text-gray-500">
                  {satsToBtc(winner.balance_at_snapshot_satoshi)}
                </td>
                <td className="dark:text-primary px-2 py-3 text-right text-xs whitespace-nowrap text-gray-500">
                  {winner.win_probability_percent.toFixed(4)}%
                </td>
                <td className="dark:text-primary px-2 py-3 text-right text-xs whitespace-nowrap text-gray-500">
                  {winner.distributable_rate.toFixed(4)}%
                </td>
                <td className="dark:text-primary px-2 py-3 text-right text-xs font-bold whitespace-nowrap text-gray-500">
                  {winner.original_reward_satoshi.toLocaleString()} sats
                </td>
                <td className="dark:text-primary px-2 py-3 text-right text-xs font-bold whitespace-nowrap text-gray-500">
                  {winner.final_reward_satoshi.toLocaleString()} sats
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs whitespace-nowrap ${getStatusBadgeColor(
                        winner.status,
                      )} ${winner.status === "redistribute" ? "ml-4" : ""}`}
                    >
                      {getStatusText(winner.status)}
                    </span>
                    {winner.status === "redistribute" && (
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
                          },
                        )}
                      >
                        <InfoCircleOutlined className="dark:text-primary cursor-pointer text-gray-400" />
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
                    { count: remainingCount },
                  )}
                  (
                  {t(
                    "payoutReport.downloadVerification",
                    "Please download the verification package to view the full list",
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
