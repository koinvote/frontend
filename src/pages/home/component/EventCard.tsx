import { type EventSummary } from "@/pages/home/types/index";
import { EventState } from "@/api/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import BTCIcon from "@/assets/icons/btc.svg?react";

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

  // CLOSED
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

  return "Ended";
}

export function EventCard({ event, onClick }: EventCardProps) {
  const countdown = formatCountdown(event);
  const primaryReply = event.top_replies[0];
  const secondaryReply = event.top_replies[1];

  return (
    <article
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-border bg-surface px-4 py-3 md:px-6 md:py-4 transition md:hover:bg-surface/80"
    >
      {/* header row: title + bounty + time */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-base md:text-lg font-semibold text-primary">
          {event.title}
        </h2>
        <div className="flex flex-row items-center gap-4 text-xs md:text-sm text-secondary">
          <span className="flex items-center gap-1">
            <BTCIcon />{" "}
            <span className="font-semibold text-accent">
              {event.total_reward_btc} BTC
            </span>
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

      {/* footer: participants + total stake */}
      <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-secondary">
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span>{event.participants_count} participants</span>
        </div>
        <div className="flex items-center gap-1">
          <span>₿</span>
          <span>{event.total_stake_btc} BTC total</span>
        </div>
      </div>
    </article>
  );
}
