import { type EventSummary } from "@/pages/create-event/types/index";
import { type EventOption } from "@/api/response";
import { EventStatus } from "@/api/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useToast } from "@/components/base/Toast/useToast";
import { Tooltip } from "antd";
import { useState, useEffect, useRef, useMemo } from "react";
import { satsToBtc, formatOngoingCountdown } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";
import { useHomeStore } from "@/stores/homeStore";

import BTCIcon from "@/assets/icons/btc.svg?react";
import EventCardParticipantsIcon from "@/assets/icons/eventCard-participants.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
dayjs.extend(relativeTime);
dayjs.extend(utc);

interface EventCardProps {
  event: EventSummary;
  onClick?: () => void;
}

function formatCountdown(event: EventSummary) {
  if (event.status === EventStatus.ACTIVE) {
    return formatOngoingCountdown(event.deadline_at);
  }

  // PREHEAT
  if (event.status === EventStatus.PREHEAT) {
    const now = dayjs();
    // 確保將服務器返回的 UTC 時間正確解析為 UTC
    // 預熱階段應倒數至 started_at（事件進入 Ongoing 的時間）
    const startAt = event.started_at
      ? dayjs.utc(event.started_at)
      : dayjs.utc(event.deadline_at); // fallback 防呆
    if (startAt.isBefore(now)) return "Starting soon";
    const diffMs = startAt.diff(now);
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `Starts in ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `Starts in ${minutes}m ${seconds}s`;
    }
    return `Starts in ${seconds}s`;
  }

  // COMPLETED //
  if (event.status === EventStatus.COMPLETED) {
    if (event.ended_at) {
      // 確保將服務器返回的 UTC 時間正確解析為 UTC
      const ended = dayjs.utc(event.ended_at);
      const now = dayjs();
      const diffDays = now.diff(ended, "day");

      if (diffDays < 1) {
        const hours = now.diff(ended, "hour");
        return `${hours}h ago`;
      }
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      }
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }
    // If no ended_at, use deadline_at as fallback
    // 確保將服務器返回的 UTC 時間正確解析為 UTC
    const deadline = dayjs.utc(event.deadline_at);
    const now = dayjs();
    if (deadline.isBefore(now)) {
      const diffDays = now.diff(deadline, "day");
      if (diffDays < 1) {
        const hours = now.diff(deadline, "hour");
        return `${hours}h ago`;
      }
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      }
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }
    return "Ended";
  }

  return "Ended";
}

interface ReplyItemProps {
  reply: {
    body: string;
    weight_percent: number;
    amount_satoshi: string;
  };
}

function ReplyItem({ reply }: ReplyItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const hasOverflowRef = useRef(false); // 使用 ref 记录是否曾经溢出，避免依赖问题
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (!textRef.current) return;

      if (isExpanded) {
        setShowToggle(hasOverflowRef.current);
        return;
      }

      // Get computed styles to calculate line height
      const computedStyle = window.getComputedStyle(textRef.current);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.5;

      // Create a clone to measure full height without affecting the original
      const clone = textRef.current.cloneNode(true) as HTMLElement;
      clone.className = "text-primary break-words"; // Remove line-clamp, keep break-words
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.width = `${textRef.current.offsetWidth}px`;
      clone.style.whiteSpace = "normal";
      clone.style.wordBreak = "break-word";
      clone.style.overflow = "visible";
      clone.style.height = "auto";
      clone.style.maxHeight = "none";
      clone.style.webkitLineClamp = "none";
      clone.style.display = "block";

      document.body.appendChild(clone);
      const fullHeight = clone.scrollHeight;
      document.body.removeChild(clone);

      const clampedHeight = textRef.current.clientHeight;
      const expectedHeight = lineHeight;
      const TOLERANCE = 2;

      // Check if content exceeds 1 line
      const isOverflowing =
        fullHeight > expectedHeight + TOLERANCE ||
        fullHeight > clampedHeight + TOLERANCE;

      if (isOverflowing) {
        hasOverflowRef.current = true;
      }
      setShowToggle(hasOverflowRef.current || isOverflowing);
    };

    // Check on mount and resize, with a small delay to ensure DOM is ready
    const timer = setTimeout(checkOverflow, 0);
    window.addEventListener("resize", checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [reply.body, isExpanded]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors 
        dark:md:hover:bg-[rgba(var(--color-gray-450-rgb),0.8)] md:hover:bg-gray-200`}
    >
      <p
        ref={textRef}
        className={`text-primary break-words pt-1 ${
          isExpanded ? "" : "line-clamp-1"
        } ${showToggle ? "cursor-pointer" : ""}`}
        onClick={showToggle ? handleToggle : undefined}
      >
        {reply.body}
      </p>
      <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-end text-[11px] text-secondary">
        <div className="flex items-center justify-end gap-2 md:gap-2">
          <span>Weight: {Number(reply.weight_percent.toFixed(2))}%</span>
          <span>
            Amount:{" "}
            {satsToBtc(parseFloat(reply.amount_satoshi || "0"), {
              suffix: false,
            })}{" "}
            BTC
          </span>
        </div>
      </div>
    </div>
  );
}

function SingleChoiceOptions({
  options,
}: {
  options: EventOption[] | string[];
}) {
  const sortedOptions = useMemo(() => {
    const allObjects =
      Array.isArray(options) &&
      options.every((opt) => typeof opt === "object" && opt !== null);
    if (!allObjects) return options;

    return [...options].sort((a, b) => {
      const wa = typeof a === "object" ? a.weight_percent : 0;
      const wb = typeof b === "object" ? b.weight_percent : 0;
      return wb - wa; // descending
    });
  }, [options]);

  const [isExpanded, setIsExpanded] = useState(false);

  const displayOptions = isExpanded ? sortedOptions : sortedOptions.slice(0, 2);
  const hasMore = sortedOptions.length > 2;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMore) setIsExpanded((prev) => !prev);
  };

  return (
    <section
      data-options-list
      className={`mt-3 rounded-xl border border-border px-3 py-2 text-xs md:text-sm bg-[rgba(var(--color-gray-450-rgb),0.5)] transition-colors ${
        hasMore
          ? "cursor-pointer dark:md:hover:bg-[rgba(var(--color-gray-450-rgb),0.8)] md:hover:bg-gray-200"
          : ""
      }`}
      onClick={handleToggle}
    >
      <div className="mb-1 text-[11px] md:text-xs text-secondary flex items-center justify-between">
        <span>{sortedOptions.length > 1 ? "Options" : "Option"}</span>
        {hasMore && (
          <span className="flex items-center gap-1">
            {isExpanded ? "View less" : "View all"}
          </span>
        )}
      </div>

      {displayOptions.map((opt, index) => (
        <div key={index}>
          {index > 0 && <div className="my-1 border-t border-border" />}
          <div className="py-1">
            <p className="text-primary break-words line-clamp-1">
              {typeof opt === "string" ? opt : opt.option_text}
            </p>
            <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-end text-[11px] text-secondary">
              <div className="flex items-center justify-end gap-2 md:gap-2">
                {typeof opt !== "string" && (
                  <>
                    <span>
                      Weight: {Number(opt.weight_percent.toFixed(2))}%
                    </span>
                    <span>
                      Amount:{" "}
                      {satsToBtc(opt.total_stake_satoshi, {
                        suffix: false,
                      })}{" "}
                      BTC
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export function EventCard({ event, onClick }: EventCardProps) {
  const { showToast } = useToast();
  const [countdown, setCountdown] = useState(() => formatCountdown(event));

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatCountdown(event));
    };

    updateCountdown();

    // For ACTIVE / PREHEAT: tick every 1s; others can be slower
    const interval = setInterval(
      updateCountdown,
      event.status === EventStatus.ACTIVE ||
        event.status === EventStatus.PREHEAT
        ? 1000
        : 30_000
    );

    return () => clearInterval(interval);
  }, [event]);

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
        ""
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
      showToast("success", "Copied URL to clipboard");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      showToast("error", "Failed to copy URL");
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
        <h2 className="text-base md:text-lg font-semibold text-primary w-full md:min-w-0 md:flex-1 md:flex-shrink break-words">
          {event.title}
        </h2>
        <div className="flex-shrink-0">
          <Tooltip
            title={
              event.status === EventStatus.PREHEAT
                ? "Replies open after the countdown ends."
                : "After the countdown, this reward will be distributed"
            }
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
            overlayClassName="event-card-tooltip"
          >
            <div
              {...triggerProps}
              className="flex flex-row md:flex-col items-center md:items-end 
          gap-4 md:gap-1 text-xs md:text-sm text-secondary"
            >
              <span className="font-semibold text-accent flex items-center gap-1 ">
                <BTCIcon />
                {event.total_reward_btc} BTC
              </span>
              <span className="tabular-nums">{countdown}</span>
            </div>
          </Tooltip>
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
          className={`mt-2 text-xs md:text-sm text-secondary break-words overflow-wrap-anywhere ${
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
            {isDescriptionExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* top replies or options */}
      {event.event_type === "single_choice" &&
      event.options &&
      event.options.length > 0 ? (
        <SingleChoiceOptions options={event.options} />
      ) : (
        (primaryReply || secondaryReply) && (
          <section
            data-top-replies
            className="mt-3 rounded-xl border border-border px-3 py-2 text-xs md:text-sm bg-[rgba(var(--color-gray-450-rgb),0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 text-[11px] md:text-xs text-secondary">
              Top reply
            </div>

            {primaryReply && <ReplyItem reply={primaryReply} />}

            {primaryReply && secondaryReply && (
              <div className="my-1 border-t border-border" />
            )}

            {secondaryReply && <ReplyItem reply={secondaryReply} />}
          </section>
        )
      )}

      {/* footer: participants + total stake + copy */}
      <div className="mt-3 text-[11px] md:text-xs text-secondary">
        {!isDesktop ? (
          /* Mobile Layout: Three items distributed evenly */
          <div className="flex items-center justify-between">
            <Tooltip
              title="Total participation addresses"
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
              title="Total participation amount"
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
                title="Total participation addresses"
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
                    <span className="hidden md:inline"> participants</span>
                  </span>
                </div>
              </Tooltip>
              <Tooltip
                title="Total participation amount"
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
                    <span className="hidden md:inline"> BTC total</span>
                  </span>
                </div>
              </Tooltip>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="cursor-pointer flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary flex-shrink-0"
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
