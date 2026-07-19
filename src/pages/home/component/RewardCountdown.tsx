import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import RewardBtcIcon from "@/assets/icons/reward-btc.svg?react";

export interface RewardCountdownProps {
  totalRewardBtc: string;
  countdown: string;
  showPaidBadge?: boolean;
  triggerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function RewardCountdown({
  totalRewardBtc,
  countdown,
  showPaidBadge,
  triggerProps,
}: RewardCountdownProps) {
  const { t } = useTranslation();

  return (
    <div
      {...triggerProps}
      className="text-secondary flex flex-row items-center gap-4 text-xs md:flex-col md:items-end md:gap-1 md:text-sm"
    >
      {Number(totalRewardBtc) > 0 && (
        <span className="text-accent flex items-center gap-1 font-semibold">
          <RewardBtcIcon className="h-5 w-5" />
          {Number(totalRewardBtc)} BTC
          {/* Badge uses pt-[3px] pb-px, not symmetric py: uppercase glyphs
              leave the font's descender space empty below the baseline, so
              symmetric padding reads as the text sitting high in the pill. */}
          {showPaidBadge && (
            <span className="bg-gray-450 text-secondary ml-1 shrink-0 rounded px-1.5 pt-[3px] pb-px text-[10px] leading-none font-medium">
              {t("eventCard.paid", "PAID")}
            </span>
          )}
        </span>
      )}
      <span className="tabular-nums">{countdown}</span>
    </div>
  );
}

export interface RewardCountdownWithTooltipProps {
  tooltipText: string;
  totalRewardBtc: string;
  countdown: string;
  showPaidBadge?: boolean;
  isDesktop: boolean;
  tooltipProps: Record<string, unknown>;
  triggerProps: React.HTMLAttributes<HTMLDivElement>;
}

export function RewardCountdownWithTooltip({
  tooltipText,
  totalRewardBtc,
  countdown,
  showPaidBadge,
  isDesktop,
  tooltipProps,
  triggerProps,
}: RewardCountdownWithTooltipProps) {
  return (
    <Tooltip
      title={tooltipText}
      placement={isDesktop ? "topRight" : "bottomLeft"}
      color="white"
      {...tooltipProps}
      getPopupContainer={(triggerNode) =>
        triggerNode.parentElement || document.body
      }
      autoAdjustOverflow={false}
      styles={{
        container: {
          maxWidth: isDesktop
            ? "max-content"
            : "min(300px, calc(100vw - 32px))",
          whiteSpace: isDesktop ? "nowrap" : "normal",
          width: isDesktop ? "max-content" : undefined,
        },
      }}
      className="event-card-tooltip"
    >
      <span>
        <RewardCountdown
          totalRewardBtc={totalRewardBtc}
          countdown={countdown}
          showPaidBadge={showPaidBadge}
          triggerProps={triggerProps}
        />
      </span>
    </Tooltip>
  );
}
