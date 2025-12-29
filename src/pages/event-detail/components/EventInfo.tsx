import { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import { useToast } from "@/components/base/Toast/useToast";
import { Button } from "@/components/base/Button";
import { satsToBtc } from "@/utils/formatter";
import type { EventDetailDataRes } from "@/api/response";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { TopReplyBar } from "./TopReplyBar";
import { EventCTAButton } from "./EventCTAButton";

interface EventInfoProps {
  event: EventDetailDataRes;
}

function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainingHours}h`;
}

function formatTimeRemaining(deadlineAt: string): string {
  const now = dayjs();
  const deadline = dayjs(deadlineAt);
  const diffMs = deadline.diff(now);

  if (diffMs <= 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export function EventInfo({ event }: EventInfoProps) {
  const { showToast } = useToast();

  const handleCopyLink = async () => {
    const eventUrl = `${window.location.origin}/event/${event.event_id}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      showToast("success", "Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
      showToast("error", "Failed to copy link");
    }
  };

  const rewardAmountBtc = useMemo(
    () => satsToBtc(event.initial_reward_satoshi, { suffix: false }),
    [event.initial_reward_satoshi]
  );

  const additionalRewardBtc = useMemo(() => {
    const additional =
      event.total_reward_satoshi - event.initial_reward_satoshi;
    if (additional <= 0) return "0";
    return satsToBtc(additional, { suffix: false });
  }, [event.total_reward_satoshi, event.initial_reward_satoshi]);

  const durationDisplay = useMemo(
    () => formatDuration(event.duration_hours),
    [event.duration_hours]
  );

  const preheatDurationDisplay = useMemo(
    () => (event.preheat_hours > 0 ? formatDuration(event.preheat_hours) : "0"),
    [event.preheat_hours]
  );

  // Time remaining with real-time updates
  const [timeRemaining, setTimeRemaining] = useState(() =>
    formatTimeRemaining(event.deadline_at)
  );

  useEffect(() => {
    const updateTimeRemaining = () => {
      setTimeRemaining(formatTimeRemaining(event.deadline_at));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [event.deadline_at]);

  const isRewarded = event.event_reward_type === "rewarded";

  // Calculate max recipients for rewarded events
  const maxRecipients = useMemo(() => {
    if (!isRewarded || event.winner_count === 0) return null;
    return event.winner_count;
  }, [isRewarded, event.winner_count]);

  return (
    <div className="flex flex-col gap-6">
      {/* Title and Copy Link */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary flex-1">
          {event.title}
        </h1>
        <Button
          type="button"
          appearance="outline"
          tone="primary"
          text="sm"
          className="shrink-0"
          onClick={handleCopyLink}
        >
          <CopyIcon className="w-4 h-4 mr-2" />
          Copy Link
        </Button>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm md:text-base text-secondary leading-relaxed break-words min-w-0">
          {event.description}
        </p>
      )}

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-xs md:text-sm text-secondary">Event-ID:</span>
            <span className="text-xs md:text-sm text-primary ml-2">
              {event.event_id}
            </span>
          </div>

          {isRewarded && (
            <>
              <div>
                <span className="text-xs md:text-sm text-secondary">
                  Reward Amount:
                </span>
                <span className="text-xs md:text-sm font-semibold text-primary ml-2">
                  {rewardAmountBtc} BTC
                </span>
              </div>

              {Number(additionalRewardBtc) > 0 && (
                <div>
                  <span className="text-xs md:text-sm text-secondary">
                    Additional Reward:
                  </span>
                  <span className="text-xs md:text-sm text-primary ml-2">
                    {additionalRewardBtc} BTC
                  </span>
                </div>
              )}
            </>
          )}

          <div>
            <span className="text-xs md:text-sm text-secondary">
              Duration of This Event:
            </span>
            <span className="text-xs md:text-sm text-primary ml-2">
              {durationDisplay}
            </span>
          </div>

          <div>
            <span className="text-xs md:text-sm text-secondary">
              Time Remaining:
            </span>
            <span className="text-xs md:text-sm font-semibold text-accent ml-2">
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {event.hashtags && event.hashtags.length > 0 && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                {event.hashtags.length > 1 ? "Hashtags:" : "Hashtag:"}
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {event.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-surface border border-border text-xs md:text-sm text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isRewarded && maxRecipients && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                Max Recipients:
              </span>
              <span className="text-xs md:text-sm text-primary ml-2">
                {maxRecipients} {maxRecipients === 1 ? "Address" : "Addresses"}
              </span>
            </div>
          )}

          {event.preheat_hours > 0 && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                Preheat Duration:
              </span>
              <span className="text-xs md:text-sm text-primary ml-2">
                {preheatDurationDisplay}
              </span>
            </div>
          )}

          <div>
            <span className="text-xs md:text-sm text-secondary">
              Response type:
            </span>
            <span className="text-xs md:text-sm text-primary ml-2">
              {event.event_type === "single_choice"
                ? "Single-choice"
                : "Open-ended"}
            </span>
          </div>

          {/* Creator Address */}
          {event.creator_address && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                Creator address:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs md:text-sm text-primary font-mono">
                  {event.creator_address.length > 10
                    ? `${event.creator_address.slice(
                        0,
                        6
                      )}...${event.creator_address.slice(-4)}`
                    : event.creator_address}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(event.creator_address!)
                      .then(() => showToast("success", "Address copied"))
                      .catch(() => showToast("error", "Failed to copy"));
                  }}
                  className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary"
                  aria-label="Copy creator address"
                >
                  <CopyIcon className="w-4 h-4 text-current" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Reply */}
      {event.top_replies && event.top_replies.length > 0 && (
        <div>
          <h2 className="text-sm md:text-base font-semibold text-primary mb-3">
            Top Reply
          </h2>
          <div className="space-y-2">
            {event.top_replies.map((reply, index) => (
              <TopReplyBar key={reply.id || index} reply={reply} />
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="flex justify-end">
        <EventCTAButton
          status={event.status}
          eventRewardType={event.event_reward_type}
          eventId={event.event_id}
        />
      </div>
    </div>
  );
}
