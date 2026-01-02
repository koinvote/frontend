import { type EventSummary } from "@/pages/create-event/types/index";
import { EventStatus } from "@/api/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useToast } from "@/components/base/Toast/useToast";
import { Tooltip } from "antd";
import { CustomTooltip } from "@/components/base/CustomTooltip";
import { useState, useEffect, useRef } from "react";
import { satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { useTooltipWithClick } from "@/hooks/useTooltipWithClick";

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
    const now = dayjs();
    // 確保將服務器返回的 UTC 時間正確解析為 UTC
    const deadline = dayjs.utc(event.deadline_at);
    if (deadline.isBefore(now)) return "Closing soon";
    const diffMs = deadline.diff(now);
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  // PREHEAT
  if (event.status === EventStatus.PREHEAT) {
    const now = dayjs();
    // 確保將服務器返回的 UTC 時間正確解析為 UTC
    const deadline = dayjs.utc(event.deadline_at);
    if (deadline.isBefore(now)) return "Starting soon";
    const diffMs = deadline.diff(now);
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return `Starts in ${days}d ${hours}h`;
    }
    return `Starts in ${hours}h ${minutes}m`;
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
  isLast: boolean;
}

function ReplyItem({ reply, isLast }: ReplyItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const hasOverflowRef = useRef(false); // 使用 ref 记录是否曾经溢出，避免依赖问题
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        if (isExpanded) {
          setShowToggle(hasOverflowRef.current);
          return;
        }

        // Temporarily remove line-clamp to check actual height
        const originalClass = textRef.current.className;
        textRef.current.className = textRef.current.className.replace(
          "line-clamp-1",
          ""
        );
        const fullHeight = textRef.current.scrollHeight;

        // Restore line-clamp
        textRef.current.className = originalClass;
        const clampedHeight = textRef.current.clientHeight;

        const TOLERANCE = 2;
        const isOverflowing = fullHeight > clampedHeight + TOLERANCE;

        if (isOverflowing) {
          hasOverflowRef.current = true;
        }
        setShowToggle(hasOverflowRef.current || isOverflowing);
      }
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
    <div ref={containerRef} className={isLast ? "" : "mb-1"}>
      <p
        ref={textRef}
        className={`text-primary ${isExpanded ? "" : "line-clamp-1"} ${
          showToggle ? "cursor-pointer" : ""
        }`}
        onClick={showToggle ? handleToggle : undefined}
      >
        {reply.body}
      </p>
      <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-end text-[11px] text-secondary">
        {/* Weight and Amount - 手机版在下一行靠右，桌面版也靠右 */}
        <div className="flex items-center justify-end gap-2 md:gap-2">
          <span>Weight: {reply.weight_percent}%</span>
          <span>
            Amount:{" "}
            {satsToBtc(parseFloat(reply.amount_satoshi || "0"), {
              suffix: false,
            })}{" "}
            BTC
          </span>
        </div>
      </div>
      {!isLast && <div className="mt-2 border-t border-border pt-2" />}
    </div>
  );
}

export function EventCard({ event, onClick }: EventCardProps) {
  const { showToast } = useToast();
  const countdown = formatCountdown(event);

  // 使用 Tooltip hook（用于 reward countdown）
  const { tooltipProps, triggerProps } = useTooltipWithClick();

  // 根据 amount_satoshi 排序 top_replies（降序）
  const sortedReplies = [...event.top_replies].sort((a, b) => {
    const amountA = parseFloat(a.amount_satoshi || "0");
    const amountB = parseFloat(b.amount_satoshi || "0");
    return amountB - amountA; // 降序排序
  });

  const primaryReply = sortedReplies[0];
  const secondaryReply = sortedReplies[1];

  const [isDesktop, setIsDesktop] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showDescriptionToggle, setShowDescriptionToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
        <h2 className="text-base md:text-lg font-semibold text-primary">
          {event.title}
        </h2>
        <Tooltip
          title="After the countdown, this reward will be distributed"
          placement={isDesktop ? "topRight" : "bottomLeft"}
          color="white"
          {...tooltipProps}
          getPopupContainer={(triggerNode) =>
            triggerNode.parentElement || document.body
          }
          autoAdjustOverflow={false}
          overlayInnerStyle={{
            maxWidth: isDesktop
              ? "max-content"
              : "min(300px, calc(100vw - 32px))",
            whiteSpace: isDesktop ? "nowrap" : "normal",
            width: isDesktop ? "max-content" : undefined,
          }}
          overlayClassName="event-card-tooltip"
        >
          <div
            {...triggerProps}
            className="flex flex-row md:flex-col items-center md:items-start 
          gap-4 md:gap-1 text-xs md:text-sm text-secondary"
          >
            <span className="font-semibold text-accent flex items-center gap-1">
              <BTCIcon />
              {event.total_reward_btc} BTC
            </span>
            <span>{countdown}</span>
          </div>
        </Tooltip>
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

      {/* top replies */}
      {(primaryReply || secondaryReply) && (
        <section
          data-top-replies
          className="mt-3 rounded-xl border border-border px-3 py-2 text-xs md:text-sm"
          style={{
            backgroundColor: "rgba(var(--color-gray-450-rgb), 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 text-[11px] md:text-xs text-secondary">
            Top reply
          </div>

          {primaryReply && (
            <ReplyItem reply={primaryReply} isLast={!secondaryReply} />
          )}

          {secondaryReply && <ReplyItem reply={secondaryReply} isLast={true} />}
        </section>
      )}

      {/* footer: participants + total stake + copy */}
      <div className="mt-3 text-[11px] md:text-xs text-secondary">
        {/* 手机版：三个元素平均分配 */}
        <div className="flex items-center justify-between md:hidden">
          <CustomTooltip
            title="Total participation addresses"
            placement="topLeft"
            color="white"
            getPopupContainer={(triggerNode) =>
              triggerNode.parentElement || document.body
            }
            autoAdjustOverflow={false}
            align={{
              offset: [-16, -2],
            }}
          >
            <div className="flex items-center gap-1">
              <span>
                <EventCardParticipantsIcon className="w-3 h-3" />
              </span>
              <span>{event.participants_count}</span>
            </div>
          </CustomTooltip>
          <CustomTooltip
            title="Total participation amount"
            placement="top"
            color="white"
          >
            <div className="flex items-center gap-1">
              <span>₿</span>
              <span>{event.total_stake_btc}</span>
            </div>
          </CustomTooltip>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
            aria-label="Copy event URL"
          >
            <CopyIcon className="w-4 h-4 text-current" />
          </button>
        </div>

        {/* 电脑版：左边两个，右边一个 */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CustomTooltip
              title="Total participation addresses"
              placement={isDesktop ? "topLeft" : "top"}
              color="white"
              getPopupContainer={(triggerNode) =>
                triggerNode.parentElement || document.body
              }
              autoAdjustOverflow={false}
            >
              <div className="flex items-center gap-1">
                <span>
                  <EventCardParticipantsIcon className="w-3 h-3" />
                </span>
                <span>
                  {event.participants_count}
                  <span className="hidden md:inline"> participants</span>
                </span>
              </div>
            </CustomTooltip>
            <CustomTooltip
              title="Total participation amount"
              placement="top"
              color="white"
            >
              <div className="flex items-center gap-1">
                <span>₿</span>
                <span>
                  {event.total_stake_btc}
                  <span className="hidden md:inline"> BTC total</span>
                </span>
              </div>
            </CustomTooltip>
          </div>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary flex-shrink-0"
            aria-label="Copy event URL"
          >
            <CopyIcon className="w-4 h-4 text-current" />
          </button>
        </div>
      </div>
    </article>
  );
}
