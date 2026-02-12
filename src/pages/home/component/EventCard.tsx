import { Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { EventStatus } from "@/api/types";
import CopyIcon from "@/assets/icons/copy.svg?react";
import EventCardParticipantsIcon from "@/assets/icons/eventCard-participants.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { type EventSummary } from "@/pages/create-event/types/index";
import { useHomeStore } from "@/stores/homeStore";
import { useDebouncedClick } from "@/utils/helper";

import { formatCountdown } from "./formatCountdown";
import { ReplyItem } from "./ReplyItem";
import { RewardCountdown, RewardCountdownWithTooltip } from "./RewardCountdown";
import { SingleChoiceOptions } from "./SingleChoiceOptions";

interface EventCardProps {
  event: EventSummary;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(() => formatCountdown(event, t));

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatCountdown(event, t));
    };

    updateCountdown();

    // For ACTIVE / PREHEAT: tick every 1s; others can be slower
    const interval = setInterval(
      updateCountdown,
      event.status === EventStatus.ACTIVE ||
        event.status === EventStatus.PREHEAT
        ? 1000
        : 30_000,
    );

    return () => clearInterval(interval);
  }, [event, t]);

  const { isDesktop } = useHomeStore();

  const { tooltipProps, triggerProps } = useTooltipWithClick({
    keepOpenOnClick: !isDesktop,
  });

  const {
    tooltipProps: participantsTooltipProps,
    triggerProps: participantsTriggerProps,
  } = useTooltipWithClick({ keepOpenOnClick: !isDesktop });

  const { tooltipProps: amountTooltipProps, triggerProps: amountTriggerProps } =
    useTooltipWithClick({ keepOpenOnClick: !isDesktop });

  const sortedReplies = [...event.top_replies].sort((a, b) => {
    const amountA = parseFloat(a.amount_satoshi || "0");
    const amountB = parseFloat(b.amount_satoshi || "0");
    return amountB - amountA; // 降序排序
  });

  const primaryReply = sortedReplies[0];
  const secondaryReply = sortedReplies[1];

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showDescriptionToggle, setShowDescriptionToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Check if description overflows
  useEffect(() => {
    const checkDescriptionOverflow = () => {
      if (!descriptionRef.current) return;

      // Get computed styles
      const computedStyle = window.getComputedStyle(descriptionRef.current);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.5;

      // Create a clone to measure without affecting the original
      const clone = descriptionRef.current.cloneNode(true) as HTMLElement;
      clone.className = descriptionRef.current.className.replace(
        "line-clamp-2",
        "",
      );
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.width = `${descriptionRef.current.offsetWidth}px`;
      clone.style.whiteSpace = "normal";
      clone.style.wordBreak = "break-word";
      clone.style.overflow = "visible";
      clone.style.height = "auto";
      clone.style.maxHeight = "none";

      document.body.appendChild(clone);
      const fullHeight = clone.scrollHeight;
      document.body.removeChild(clone);

      const clampedHeight = descriptionRef.current.clientHeight;

      // Calculate expected height for 2 lines
      const expectedHeight = lineHeight * 2;
      const TOLERANCE = 2;

      // Check if content exceeds 2 lines
      const isOverflowing =
        fullHeight > expectedHeight + TOLERANCE ||
        fullHeight > clampedHeight + TOLERANCE;

      setShowDescriptionToggle(isOverflowing || isDescriptionExpanded);
    };

    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(checkDescriptionOverflow, 0);
    window.addEventListener("resize", checkDescriptionOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkDescriptionOverflow);
    };
  }, [event.description, isDescriptionExpanded]);

  const handleDescriptionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleCopyUrl = useDebouncedClick(async () => {
    const eventUrl = `${window.location.origin}/event/${event.event_id}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      showToast("success", t("eventCard.copiedUrl", "Copied URL to clipboard"));
    } catch (error) {
      console.error("Failed to copy URL:", error);
      showToast("error", t("eventCard.failedToCopy", "Failed to copy URL"));
    }
  });

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    // Don't trigger if clicking on a button, description area, or inside top replies section
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest("section[data-top-replies]") ||
      target.closest("[data-description-area]")
    ) {
      return;
    }
    onClick?.();
  };

  return (
    <article
      onClick={handleCardClick}
      className="cursor-pointer rounded-2xl border border-border bg-bg px-4 py-3 md:px-6 md:py-4 transition md:hover:bg-surface/80"
    >
      {/* header row: title + reward + time */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-base md:text-lg font-semibold text-primary w-full md:min-w-0 md:flex-1 md:shrink wrap-break-word">
          {event.title}
        </h2>
        <div className="shrink-0">
          {event.status === EventStatus.PREHEAT && (
            <RewardCountdownWithTooltip
              tooltipText={t(
                "eventCard.repliesOpenTooltip",
                "Replies open after the countdown ends.",
              )}
              totalRewardBtc={event.total_reward_btc}
              countdown={countdown}
              isDesktop={isDesktop}
              tooltipProps={tooltipProps}
              triggerProps={triggerProps}
            />
          )}
          {event.status !== EventStatus.PREHEAT &&
            event.event_reward_type === "rewarded" && (
              <RewardCountdownWithTooltip
                tooltipText={t(
                  "eventCard.rewardDistributionTooltip",
                  "After the countdown, this reward will be distributed.",
                )}
                totalRewardBtc={event.total_reward_btc}
                countdown={countdown}
                isDesktop={isDesktop}
                tooltipProps={tooltipProps}
                triggerProps={triggerProps}
              />
            )}
          {event.status !== EventStatus.PREHEAT &&
            event.event_reward_type === "non_reward" && (
              <RewardCountdown
                totalRewardBtc={event.total_reward_btc}
                countdown={countdown}
                triggerProps={triggerProps}
              />
            )}
        </div>
      </div>
      {/* Description section - full width clickable area */}
      <div
        data-description-area
        className="w-full min-w-0"
        onClick={showDescriptionToggle ? handleDescriptionToggle : undefined}
        style={{
          cursor: showDescriptionToggle ? "pointer" : "default",
        }}
      >
        <p
          ref={descriptionRef}
          className={`mt-2 text-xs md:text-sm text-secondary wrap-break-word overflow-wrap-anywhere ${
            isDescriptionExpanded ? "" : "line-clamp-2"
          }`}
        >
          {event.description}
        </p>

        {showDescriptionToggle && (
          <button
            type="button"
            className="mt-1 text-xs md:text-sm cursor-pointer"
            onClick={handleDescriptionToggle}
          >
            {isDescriptionExpanded
              ? t("eventCard.showLess", "Show less")
              : t("eventCard.showMore", "Show more")}
          </button>
        )}
      </div>

      {/* top replies or options */}
      {event.event_type === "single_choice" &&
      event.options &&
      event.options.length > 0 ? (
        <SingleChoiceOptions options={event.options} t={t} />
      ) : (
        (primaryReply || secondaryReply) && (
          <section
            data-top-replies
            className="mt-3 rounded-xl border border-border px-3 py-2 text-xs md:text-sm bg-[rgba(var(--color-gray-450-rgb),0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 text-[11px] md:text-xs text-secondary">
              {t("eventCard.topReply", "Top reply")}
            </div>

            {primaryReply && <ReplyItem reply={primaryReply} t={t} />}

            {primaryReply && secondaryReply && (
              <div className="my-1 border-t border-border" />
            )}

            {secondaryReply && <ReplyItem reply={secondaryReply} t={t} />}
          </section>
        )
      )}

      {/* footer: participants + total stake + copy */}
      <div className="mt-3 text-[11px] md:text-xs text-secondary">
        {!isDesktop ? (
          /* Mobile Layout: Three items distributed evenly */
          <div className="flex items-center justify-between">
            <Tooltip
              title={t(
                "eventCard.totalAddresses",
                "Total participation addresses",
              )}
              placement="topLeft"
              color="white"
              {...participantsTooltipProps}
              getPopupContainer={(triggerNode) =>
                triggerNode.parentElement || document.body
              }
              autoAdjustOverflow={false}
              align={{
                offset: [-16, -2],
              }}
            >
              <div
                {...participantsTriggerProps}
                className="flex items-center gap-1"
              >
                <span>
                  <EventCardParticipantsIcon className="w-3 h-3" />
                </span>
                <span>{event.participants_count}</span>
              </div>
            </Tooltip>
            <Tooltip
              title={t("eventCard.totalAmount", "Total participation amount")}
              placement="top"
              color="white"
              {...amountTooltipProps}
            >
              <div {...amountTriggerProps} className="flex items-center gap-1">
                <span>₿</span>
                <span>{event.total_stake_btc}</span>
              </div>
            </Tooltip>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
              aria-label="Copy event URL"
            >
              <CopyIcon className="w-4 h-4 text-current" />
            </button>
          </div>
        ) : (
          /* Desktop Layout: Left two items, right copy button */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip
                title={t(
                  "eventCard.totalAddresses",
                  "Total participation addresses",
                )}
                placement="topLeft"
                color="white"
                {...participantsTooltipProps}
                getPopupContainer={(triggerNode) =>
                  triggerNode.parentElement || document.body
                }
                autoAdjustOverflow={false}
              >
                <div
                  {...participantsTriggerProps}
                  className="flex items-center gap-1"
                >
                  <span>
                    <EventCardParticipantsIcon className="w-3 h-3" />
                  </span>
                  <span>
                    {event.participants_count}
                    <span className="hidden md:inline">
                      {" "}
                      {t("eventCard.participants", "participants")}
                    </span>
                  </span>
                </div>
              </Tooltip>
              <Tooltip
                title={t("eventCard.totalAmount", "Total participation amount")}
                placement="top"
                color="white"
                {...amountTooltipProps}
              >
                <div
                  {...amountTriggerProps}
                  className="flex items-center gap-1"
                >
                  <span>₿</span>
                  <span>
                    {event.total_stake_btc}
                    <span className="hidden md:inline">
                      {" "}
                      {t("eventCard.btcTotal", "BTC total")}
                    </span>
                  </span>
                </div>
              </Tooltip>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="cursor-pointer flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary shrink-0"
              aria-label="Copy event URL"
            >
              <CopyIcon className="w-4 h-4 text-current" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
