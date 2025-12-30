import { type EventSummary } from "@/pages/create-event/types/index";
import { EventStatus } from "@/api/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useToast } from "@/components/base/Toast/useToast";
import { Tooltip } from "antd";
import { useState, useEffect, useRef } from "react";
import { satsToBtc } from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";

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
        // 如果已展开，保持 showToggle 为 true（如果曾经溢出过）
        if (isExpanded) {
          setShowToggle(hasOverflowRef.current);
          return;
        }

        // 只在折叠状态下检查溢出
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

        // 方法 1: 添加容差值（tolerance）- 已启用
        // 只有当高度差超过指定像素值时才显示按钮，避免因微小差异触发
        const TOLERANCE = 2; // 像素容差值：2-3 为平衡值（1=更敏感, 5+=更不敏感）
        const isOverflowing = fullHeight > clampedHeight + TOLERANCE;

        // 方法 2: 使用百分比阈值（更灵活）- 已禁用
        // const OVERFLOW_THRESHOLD = 0.1; // 10% 溢出阈值
        // const heightDiff = fullHeight - clampedHeight;
        // const overflowRatio = heightDiff / clampedHeight;
        // const isOverflowing = overflowRatio > OVERFLOW_THRESHOLD;

        // 方法 3: 使用行数检测（更直观）- 已禁用
        // const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight);
        // const actualLines = Math.ceil(fullHeight / lineHeight);
        // const isOverflowing = actualLines > 1;

        // 记录是否曾经溢出（一旦溢出，即使展开后也要保持可点击）
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

  // 根据 amount_satoshi 排序 top_replies（降序）
  const sortedReplies = [...event.top_replies].sort((a, b) => {
    const amountA = parseFloat(a.amount_satoshi || "0");
    const amountB = parseFloat(b.amount_satoshi || "0");
    return amountB - amountA; // 降序排序
  });

  const primaryReply = sortedReplies[0];
  const secondaryReply = sortedReplies[1];

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
    // Don't trigger if clicking on a button or inside top replies section
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest("section[data-top-replies]")
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
        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-1 text-xs md:text-sm text-secondary">
          <span className="flex items-center gap-1">
            <BTCIcon />{" "}
            <Tooltip
              title="After the countdown, this reward will be distributed"
              placement={isDesktop ? "topRight" : "bottomLeft"}
              color="white"
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
              <span className="font-semibold text-accent">
                {event.total_reward_btc} BTC
              </span>
            </Tooltip>
          </span>
          <span>{countdown}</span>
        </div>
      </div>

      {/* description preview */}
      <p className="mt-2 line-clamp-2 text-xs md:text-sm text-secondary">
        {event.description}
      </p>

      {/* show more (靜態 placeholder，之後可以做可展開描述) */}
      <button
        type="button"
        className="mt-1 text-xs md:text-sm cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        Show more
      </button>

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
      <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-secondary">
        {/* 手机版：三个元素平均分配 */}
        <div className="flex items-center gap-1 md:hidden">
          <span>
            <EventCardParticipantsIcon className="w-3 h-3" />
          </span>
          <Tooltip
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
            <span
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => e.stopPropagation()}
            >
              {event.participants_count}
            </span>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <span>₿</span>
          <Tooltip
            title="Total participation amount"
            placement="top"
            color="white"
          >
            <span
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => e.stopPropagation()}
            >
              {event.total_stake_btc}
            </span>
          </Tooltip>
        </div>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary md:hidden"
          aria-label="Copy event URL"
        >
          <CopyIcon className="w-4 h-4 text-current" />
        </button>

        {/* 电脑版：左边两个，右边一个 */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>
              <EventCardParticipantsIcon className="w-3 h-3" />
            </span>
            <Tooltip
              title="Total participation addresses"
              placement="topLeft"
              color="white"
            >
              <span
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => e.stopPropagation()}
              >
                {event.participants_count}
                <span className="hidden md:inline"> participants</span>
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1">
            <span>₿</span>
            <Tooltip
              title="Total participation amount"
              placement="top"
              color="white"
            >
              <span
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => e.stopPropagation()}
              >
                {event.total_stake_btc}
                <span className="hidden md:inline"> BTC total</span>
              </span>
            </Tooltip>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="hidden md:flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
          aria-label="Copy event URL"
        >
          <CopyIcon className="w-4 h-4 text-current" />
        </button>
      </div>
    </article>
  );
}
