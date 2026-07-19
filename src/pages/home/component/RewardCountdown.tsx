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
  const { t, i18n } = useTranslation();

  // Optical centering, tuned per script on 2x devices: Latin uppercase
  // ("PAID") leaves the font's descender space empty below the baseline and
  // needs a 1px downward nudge; CJK glyphs ("已發放") sit slightly high too
  // but only need half that. Both keep the same 4px total vertical padding.
  const badgePaddingY = i18n.language?.startsWith("zh")
    ? "pt-[2.5px] pb-[1.5px]"
    : "pt-[3px] pb-px";

  return (
    <div
      {...triggerProps}
      className="text-secondary flex flex-row items-center gap-4 text-xs md:flex-col md:items-end md:gap-1 md:text-sm"
    >
      {Number(totalRewardBtc) > 0 && (
        <span className="text-accent flex items-center gap-1 font-semibold">
          <RewardBtcIcon className="h-5 w-5" />
          {Number(totalRewardBtc)} BTC
          {showPaidBadge && (
            <span
              className={`bg-gray-450 text-secondary ml-1 shrink-0 rounded px-1.5 text-[10px] leading-none font-medium ${badgePaddingY}`}
            >
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
