import { type EventSummary } from "@/pages/create-event/types/index";
import { EventState } from "@/api/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useToast } from "@/components/base/Toast/useToast";
import { Tooltip } from "antd";
import { useState, useEffect, useRef } from "react";

import BTCIcon from "@/assets/icons/btc.svg?react";
import EventCardParticipantsIcon from "@/assets/icons/eventCard-participants.svg?react";
import CopyIcon from "@/assets/icons/copy.svg?react";
dayjs.extend(relativeTime);

interface EventCardProps {
  event: EventSummary;
  onClick?: () => void;
}

function formatCountdown(event: EventSummary) {
  if (event.state === EventState.ONGOING) {
    const now = dayjs();
    const deadline = dayjs(event.deadline_at);
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
  if (event.state === EventState.PREHEAT) {
    const now = dayjs();
    const deadline = dayjs(event.deadline_at);
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
  if (event.state === EventState.COMPLETED) {
    if (event.ended_at) {
      const ended = dayjs(event.ended_at);
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
    const deadline = dayjs(event.deadline_at);
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

export function EventCard({ event, onClick }: EventCardProps) {
  console.log("event", event);
  const { showToast } = useToast();
  const countdown = formatCountdown(event);
  const primaryReply = event.top_replies[0];
  const secondaryReply = event.top_replies[1];

  const [isDesktop, setIsDesktop] = useState(false);
  const lastCopyTimeRef = useRef<number>(0);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLastCopy = now - lastCopyTimeRef.current;

    if (timeSinceLastCopy < 2000) {
      return;
    }

    lastCopyTimeRef.current = now;

    try {
      const eventUrl = `${window.location.origin}/event/${event.event_id}`;
      await navigator.clipboard.writeText(eventUrl);
      showToast("success", "Copied URL to clipboard");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      showToast("error", "Failed to copy URL");
    }
  };

  return (
    <article
      onClick={onClick}
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
              placement="topRight"
              color="white"
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
        className="mt-1 text-xs md:text-sm text-accent underline"
        onClick={onClick}
      >
        Show more
      </button>

      {/* top replies */}
      {(primaryReply || secondaryReply) && (
        <section className="mt-3 rounded-xl bg-bg border border-border px-3 py-2 text-xs md:text-sm">
          <div className="mb-1 text-[11px] md:text-xs text-secondary">
            Top replies
          </div>

          {primaryReply && (
            <div className="mb-1">
              <p className="line-clamp-1 text-primary">{primaryReply.body}</p>
              <div className="mt-1 flex justify-between text-[11px] text-secondary">
                <span>Weight: {primaryReply.weight_percent}%</span>
                <span>Amount: {primaryReply.amount_btc} BTC</span>
              </div>
            </div>
          )}

          {secondaryReply && (
            <div className="mt-2 border-t border-border pt-2">
              <p className="line-clamp-1 text-primary">{secondaryReply.body}</p>
              <div className="mt-1 flex justify-between text-[11px] text-secondary">
                <span>Weight: {secondaryReply.weight_percent}%</span>
                <span>Amount: {secondaryReply.amount_btc} BTC</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* footer: participants + total stake + copy */}
      <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-secondary">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>
              <EventCardParticipantsIcon className="w-3 h-3" />
            </span>
            <span>
              {event.participants_count}
              <span className="hidden md:inline"> participants</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>₿</span>
            <span>
              {event.total_stake_btc}
              <span className="hidden md:inline"> BTC total</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
          aria-label="Copy event URL"
        >
          <CopyIcon className="w-4 h-4 text-current" />
        </button>
      </div>
    </article>
  );
}
