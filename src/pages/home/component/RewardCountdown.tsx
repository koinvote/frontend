import { Tooltip } from "antd";

import BTCIcon from "@/assets/icons/btc.svg?react";

export interface RewardCountdownProps {
  totalRewardBtc: string;
  countdown: string;
  triggerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function RewardCountdown({
  totalRewardBtc,
  countdown,
  triggerProps,
}: RewardCountdownProps) {
  return (
    <div
      {...triggerProps}
      className="flex flex-row md:flex-col items-center md:items-end
          gap-4 md:gap-1 text-xs md:text-sm text-secondary"
    >
      <span className="font-semibold text-accent flex items-center gap-1 ">
        <BTCIcon />
        {totalRewardBtc} BTC
      </span>
      <span className="tabular-nums">{countdown}</span>
    </div>
  );
}

export interface RewardCountdownWithTooltipProps {
  tooltipText: string;
  totalRewardBtc: string;
  countdown: string;
  isDesktop: boolean;
  tooltipProps: Record<string, unknown>;
  triggerProps: React.HTMLAttributes<HTMLDivElement>;
}

export function RewardCountdownWithTooltip({
  tooltipText,
  totalRewardBtc,
  countdown,
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
          triggerProps={triggerProps}
        />
      </span>
    </Tooltip>
  );
}
