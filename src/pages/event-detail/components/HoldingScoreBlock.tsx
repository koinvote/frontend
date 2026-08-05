import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import InfoIcon from "@/assets/icons/info.svg?react";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useHomeStore } from "@/stores/homeStore";
import { cn } from "@/utils/style";

interface HoldingScoreBlockProps {
  holdingScore?: string;
  scoreShare?: string;
  // The address's current on-chain balance, used only while the event is
  // still active to decide Accumulating (balance > 0) vs Paused (balance
  // is 0, so the score has stopped growing). Ignored once scoreShare is
  // present, since a settled event no longer accumulates either way.
  currentBalanceSatoshi?: number | null;
  // Set on a reply that a later one from the same address has superseded.
  // The score is the address's, not this card's, so repeating the figure here
  // would show the same number twice and read as if it were counted twice.
  // The label stays - only the figure and its status are replaced by a link.
  onSeeLatest?: () => void;
  className?: string;
}

// Renders nothing when holdingScore is absent (non-rewarded event, or no
// score data yet) - never fakes a 0 or a placeholder value. Whether the
// event has settled is inferred entirely from whether the backend included
// scoreShare, since it only ever sends that once the event's snapshot has
// been computed.
export function HoldingScoreBlock({
  holdingScore,
  scoreShare,
  currentBalanceSatoshi,
  onSeeLatest,
  className,
}: HoldingScoreBlockProps) {
  const { t } = useTranslation();
  const { isDesktop } = useHomeStore();
  const { tooltipProps, triggerProps } = useTooltipWithClick({
    keepOpenOnClick: !isDesktop,
    singleLine: false,
  });

  if (!holdingScore) return null;

  const isFinal = scoreShare != null;

  // The figure is the address's, not this card's, so a superseded reply
  // points at the address's current card rather than restating it.
  const seeLatestLink = onSeeLatest && (
    <button
      type="button"
      onClick={onSeeLatest}
      className="text-accent mt-2 cursor-pointer self-start text-xs underline underline-offset-2"
    >
      {t("replyList.seeAddressLatestReply", "See this address's latest reply")}{" "}
      <span aria-hidden="true">›</span>
    </button>
  );

  const isAccumulating = (currentBalanceSatoshi ?? 0) > 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center">
        <span
          className="text-secondary hover:text-primary flex cursor-pointer items-center gap-1 text-xs font-medium"
          {...triggerProps}
        >
          {t("replyList.holdingScore", "Holding Score")}
          <Tooltip
            title={t(
              "replyList.holdingScoreTooltip",
              "Holding Score determines the probability of winning and reward allocation. It is calculated by multiplying the address’s Bitcoin balance by the number of blocks elapsed since joining the event.",
            )}
            placement={isDesktop ? "top" : "bottom"}
            color="white"
            {...tooltipProps}
            getPopupContainer={(triggerNode) =>
              triggerNode.parentElement || document.body
            }
            styles={{
              container: {
                maxWidth: "min(280px, calc(100vw - 32px))",
              },
            }}
          >
            <span className="inline-flex shrink-0">
              <InfoIcon className="h-3.5 w-3.5" />
            </span>
          </Tooltip>
        </span>
        {/* One slot, three states, so the block keeps its shape for the whole
            life of an event: the figure never moves, only what qualifies it.
            Accumulating/Paused reports whether the address's balance is still
            earning score, so it is dropped once the event has settled - and on
            a superseded reply, where Paused would claim the re-vote stopped
            the scoring, which it does not. */}
        {!onSeeLatest &&
          (isFinal ? (
            <span className="text-secondary ml-3 flex shrink-0 items-center gap-1.5 text-xs font-normal">
              {t("replyList.scoreShare", "Score Share")}{" "}
              <span className="tabular-nums">{scoreShare}</span>
            </span>
          ) : (
            <span
              className={cn(
                "ml-3 flex shrink-0 items-center gap-1.5 text-xs font-normal",
                isAccumulating ? "text-success/70" : "text-secondary",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span>
                {isAccumulating
                  ? t("replyList.accumulating", "Accumulating")
                  : t("replyList.paused", "Paused")}
              </span>
            </span>
          ))}
      </div>
      {seeLatestLink ?? (
        <span className="text-primary mt-2 font-mono text-xs font-normal break-all tabular-nums transition-opacity duration-150">
          {holdingScore}
        </span>
      )}
    </div>
  );
}
