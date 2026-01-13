import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useToast } from "@/components/base/Toast/useToast";
// import { Button } from "@/components/base/Button";
import {
  satsToBtc,
  formatPreheatDuration,
  formatEventDuration,
  formatPreheatCountdown,
  formatOngoingCountdown,
  formatCompletedTime,
} from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { useHomeStore } from "@/stores/homeStore";
import type { EventDetailDataRes, EventOption } from "@/api/response";
import { EventStatus } from "@/api/types";
import type { TopReply } from "@/pages/create-event/types";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { TopReplyBar } from "./TopReplyBar";
import { EventCTAButton } from "./EventCTAButton";
import ArrowDownIcon from "@/assets/icons/arrowDown.svg?react";
import ArrowUpIcon from "@/assets/icons/arrowUp.svg?react";

interface EventInfoProps {
  event: EventDetailDataRes;
}

export function EventInfo({ event }: EventInfoProps) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setActiveHashtag, setStatus, setSearch, setDebouncedSearch } =
    useHomeStore();

  // Debounced copy handler for creator address
  const handleCopyCreatorAddress = useDebouncedClick(async () => {
    if (event.creator_address) {
      try {
        await navigator.clipboard.writeText(event.creator_address);
        showToast("success", "Address copied");
      } catch {
        showToast("error", "Failed to copy");
      }
    }
  });

  // Handle address click - navigate to home with search
  const handleAddressClick = useCallback(() => {
    if (event.creator_address) {
      // Clear hashtag if any
      setActiveHashtag(null);
      // Set search to the address
      setSearch(event.creator_address);
      setDebouncedSearch(event.creator_address);
      // Navigate to home
      navigate("/");
    }
  }, [
    event.creator_address,
    setActiveHashtag,
    setSearch,
    setDebouncedSearch,
    navigate,
  ]);

  // const handleCopyLink = useDebouncedClick(async () => {
  //   const eventUrl = `${window.location.origin}/event/${event.event_id}`;
  //   try {
  //     await navigator.clipboard.writeText(eventUrl);
  //     showToast("success", "Link copied to clipboard");
  //   } catch (error) {
  //     console.error("Failed to copy link:", error);
  //     showToast("error", "Failed to copy link");
  //   }
  // });

  const isPreheat = event.status === EventStatus.PREHEAT;
  const isOngoing = event.status === EventStatus.ACTIVE;
  const isCompleted = event.status === EventStatus.COMPLETED;
  const isRewarded = event.event_reward_type === "rewarded";

  // Handle hashtag click - navigate to home with hashtag filter and keep current status tab
  const handleHashtagClick = useCallback(
    (rawTag: string) => {
      const hashtagWithPrefix = rawTag.startsWith("#") ? rawTag : `#${rawTag}`;
      if (isPreheat) {
        setStatus("preheat");
      } else if (isOngoing) {
        setStatus("ongoing");
      } else if (isCompleted) {
        setStatus("completed");
      }
      setActiveHashtag(hashtagWithPrefix);
      navigate("/");
    },
    [isPreheat, isOngoing, isCompleted, setStatus, setActiveHashtag, navigate]
  );

  // Reward calculations
  const rewardAmountBtc = useMemo(
    () => satsToBtc(event.initial_reward_satoshi, { suffix: false }),
    [event.initial_reward_satoshi]
  );

  const additionalRewardBtc = useMemo(() => {
    if (event.additional_reward_satoshi <= 0) return null;
    return satsToBtc(event.additional_reward_satoshi, { suffix: false });
  }, [event.additional_reward_satoshi]);

  // Duration calculations
  const eventDurationDisplay = useMemo(() => {
    if (isOngoing || isCompleted) {
      return formatEventDuration(event.started_at, event.deadline_at);
    }
    return null;
  }, [isOngoing, isCompleted, event.started_at, event.deadline_at]);

  const preheatDurationDisplay = useMemo(() => {
    if (event.preheat_hours > 0) {
      return formatPreheatDuration(event.preheat_hours);
    }
    return null;
  }, [event.preheat_hours]);

  // Time remaining with real-time updates
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (isPreheat) {
      return formatPreheatCountdown(event.started_at, event.preheat_hours);
    }
    if (isOngoing) {
      return formatOngoingCountdown(event.deadline_at);
    }
    if (isCompleted) {
      return formatCompletedTime(event.deadline_at);
    }
    return "";
  });

  useEffect(() => {
    if (isCompleted) {
      // Completed state doesn't need countdown
      setTimeRemaining(formatCompletedTime(event.deadline_at));
      return;
    }

    const updateTimeRemaining = () => {
      if (isPreheat) {
        setTimeRemaining(
          formatPreheatCountdown(event.started_at, event.preheat_hours)
        );
      } else if (isOngoing) {
        setTimeRemaining(formatOngoingCountdown(event.deadline_at));
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [
    isPreheat,
    isOngoing,
    isCompleted,
    event.started_at,
    event.preheat_hours,
    event.deadline_at,
  ]);

  // Prepare data for Top Reply/Options display
  const { displayData, displayTitle, hasMore } = useMemo(() => {
    const isSingleChoice = event.event_type === "single_choice";
    const isOpen = event.event_type === "open";

    // PREHEAT + single_choice: Show Options
    if (isPreheat && isSingleChoice) {
      if (!event.options || event.options.length === 0) {
        return { displayData: [], displayTitle: "", hasMore: false };
      }

      // Filter out string options, only use EventOption objects
      const validOptions = (event.options as (EventOption | string)[]).filter(
        (opt): opt is EventOption => typeof opt === "object" && "id" in opt
      );

      // Sort by order
      const sortedOptions = [...validOptions].sort((a, b) => a.order - b.order);

      // Convert EventOption to TopReply format
      const convertedData: TopReply[] = sortedOptions.map((opt) => ({
        id: opt.id.toString(),
        body: opt.option_text,
        weight_percent: opt.weight_percent,
        amount_satoshi: opt.total_stake_satoshi.toString(),
      }));

      const title = validOptions.length > 1 ? "Options" : "Option";
      return {
        displayData: convertedData,
        displayTitle: title,
        hasMore: convertedData.length > 2,
      };
    }

    // ACTIVE/COMPLETED + single_choice: Show Options or Top Reply
    if ((isOngoing || isCompleted) && isSingleChoice) {
      if (!event.options || event.options.length === 0) {
        return { displayData: [], displayTitle: "", hasMore: false };
      }

      const validOptions = (event.options as (EventOption | string)[]).filter(
        (opt): opt is EventOption => typeof opt === "object" && "id" in opt
      );

      const hasReplies = validOptions.some((opt) => opt.weight_percent > 0);

      const sortedOptions = [...validOptions].sort((a, b) => {
        if (hasReplies) {
          if (b.weight_percent !== a.weight_percent) {
            return b.weight_percent - a.weight_percent;
          }
          return a.order - b.order;
        }
        return a.order - b.order;
      });

      // Convert EventOption to TopReply format
      const convertedData: TopReply[] = sortedOptions.map((opt) => ({
        id: opt.id.toString(),
        body: opt.option_text,
        weight_percent: opt.weight_percent,
        amount_satoshi: opt.total_stake_satoshi.toString(),
      }));

      const title = hasReplies ? "Top Reply" : "Options";
      return {
        displayData: convertedData,
        displayTitle: title,
        hasMore: convertedData.length > 2,
      };
    }

    // PREHEAT + open: Don't show anything
    if (isPreheat && isOpen) {
      return { displayData: [], displayTitle: "", hasMore: false };
    }

    // ACTIVE/COMPLETED + open: Show Top Reply from top_replies
    if ((isOngoing || isCompleted) && isOpen) {
      if (!event.top_replies || event.top_replies.length === 0) {
        return { displayData: [], displayTitle: "", hasMore: false };
      }

      // Sort by weight_percent descending, limit to 5
      const sortedReplies = [...event.top_replies]
        .sort((a, b) => {
          const weightA = a.weight_percent || 0;
          const weightB = b.weight_percent || 0;
          return weightB - weightA;
        })
        .slice(0, 5);

      return {
        displayData: sortedReplies,
        displayTitle: "Top Reply",
        hasMore: sortedReplies.length > 2,
      };
    }

    return { displayData: [], displayTitle: "", hasMore: false };
  }, [
    event.event_type,
    event.options,
    event.top_replies,
    isPreheat,
    isOngoing,
    isCompleted,
  ]);

  const [isExpanded, setIsExpanded] = useState(false);

  // Build field list for mobile (ordered list)
  const mobileFields = useMemo(() => {
    const fields: Array<{
      label: string;
      value: React.ReactNode;
      key: string;
    }> = [];

    // Only show rewards in ongoing or completed state
    if ((isOngoing || isCompleted) && isRewarded && rewardAmountBtc) {
      fields.push({
        key: "reward-amount",
        label: "Reward Amount:",
        value: (
          <span className="text-xs md:text-sm font-semibold text-primary">
            {rewardAmountBtc} BTC ({event.winner_count}{" "}
            {event.winner_count === 1 ? "Address" : "Addresses"})
          </span>
        ),
      });
    }

    if ((isOngoing || isCompleted) && isRewarded && additionalRewardBtc) {
      fields.push({
        key: "additional-reward",
        label: "Additional Reward:",
        value: (
          <span className="text-xs md:text-sm text-primary">
            {additionalRewardBtc} BTC ({event.additional_winner_count}{" "}
            {event.additional_winner_count === 1 ? "Address" : "Addresses"})
          </span>
        ),
      });
    }

    fields.push({
      key: "time-remaining",
      label: "Time Remaining:",
      value: isCompleted ? (
        <div className="text-xs md:text-sm font-semibold text-black dark:text-white mt-1">
          {timeRemaining}
        </div>
      ) : (
        <span className="text-xs md:text-sm font-semibold text-accent">
          {timeRemaining}
        </span>
      ),
    });

    // Only show event duration in ongoing or completed state
    if ((isOngoing || isCompleted) && eventDurationDisplay) {
      fields.push({
        key: "duration",
        label: "Duration of This Event:",
        value: (
          <span className="text-xs md:text-sm text-primary">
            {eventDurationDisplay}
          </span>
        ),
      });
    }

    if (preheatDurationDisplay) {
      fields.push({
        key: "preheat-duration",
        label: "Preheat Duration:",
        value: (
          <span className="text-xs md:text-sm text-primary">
            {preheatDurationDisplay}
          </span>
        ),
      });
    }

    fields.push({
      key: "event-id",
      label: "Event-ID:",
      value: (
        <span className="text-xs md:text-sm text-primary">
          {event.event_id}
        </span>
      ),
    });

    // Only show creator address in ongoing or completed state
    if ((isOngoing || isCompleted) && event.creator_address) {
      fields.push({
        key: "creator-address",
        label: "Creator address:",
        value: (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleAddressClick}
              className="text-xs md:text-sm text-black dark:text-white font-mono border-b border-dashed 
              border-black dark:border-white hover:border-gray-500 dark:hover:border-gray-400 
              transition-colors cursor-pointer hover:text-gray-500 dark:hover:text-gray-400"
              aria-label="Search events by creator address"
            >
              {event.creator_address.length > 10
                ? `${event.creator_address.slice(
                    0,
                    6
                  )}...${event.creator_address.slice(-4)}`
                : event.creator_address}
            </button>
            <button
              type="button"
              onClick={handleCopyCreatorAddress}
              className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary hover:text-primary !cursor-pointer"
              aria-label="Copy creator address"
            >
              <CopyIcon className="w-4 h-4 text-current" />
            </button>
          </div>
        ),
      });
    }

    if (event.hashtags && event.hashtags.length > 0) {
      fields.push({
        key: "hashtags",
        label: event.hashtags.length > 1 ? "Hashtags:" : "Hashtag:",
        value: (
          <div className="flex flex-wrap gap-2 mt-1">
            {event.hashtags.map((tag, index) => {
              const hashtagWithPrefix = tag.startsWith("#") ? tag : `#${tag}`;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleHashtagClick(tag)}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 dark:bg-white text-black text-xs md:text-sm hover:bg-gray-300 dark:hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label={`Filter by ${hashtagWithPrefix}`}
                >
                  {hashtagWithPrefix}
                </button>
              );
            })}
          </div>
        ),
      });
    }

    return fields;
  }, [
    isOngoing,
    isCompleted,
    isRewarded,
    rewardAmountBtc,
    additionalRewardBtc,
    event.winner_count,
    event.additional_winner_count,
    timeRemaining,
    eventDurationDisplay,
    preheatDurationDisplay,
    event.event_id,
    event.creator_address,
    event.hashtags,
    showToast,
    handleAddressClick,
    handleHashtagClick,
    handleCopyCreatorAddress,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Title and Copy Link */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary flex-1 break-words min-w-0">
          {event.title}
        </h1>
        {/* <Button
          type="button"
          appearance="outline"
          tone="primary"
          text="sm"
          className="shrink-0"
          onClick={handleCopyLink}
        >
          <CopyIcon className="w-4 h-4 mr-2" />
          Copy Link
        </Button> */}
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm md:text-base text-secondary leading-relaxed break-words min-w-0">
          {event.description}
        </p>
      )}

      {/* Desktop: Two Column Layout */}
      <div className="hidden md:grid grid-cols-2 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {/* Only show rewards in ongoing or completed state */}
          {(isOngoing || isCompleted) && isRewarded && rewardAmountBtc && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                Reward Amount:
              </span>
              <span className="text-xs md:text-sm font-semibold text-primary ml-2">
                {rewardAmountBtc} BTC ({event.winner_count}{" "}
                {event.winner_count === 1 ? "Address" : "Addresses"})
              </span>
            </div>
          )}

          {(isOngoing || isCompleted) && isRewarded && additionalRewardBtc && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                Additional Reward:
              </span>
              <span className="text-xs md:text-sm text-primary ml-2">
                {additionalRewardBtc} BTC ({event.additional_winner_count}{" "}
                {event.additional_winner_count === 1 ? "Address" : "Addresses"})
              </span>
            </div>
          )}

          <div>
            <span className="text-xs md:text-sm text-secondary">
              Time Remaining:
            </span>
            {isCompleted ? (
              <div className="text-xs md:text-sm text-black dark:text-white mt-1">
                {timeRemaining}
              </div>
            ) : (
              <span className="text-xs md:text-sm font-semibold text-accent ml-2">
                {timeRemaining}
              </span>
            )}
          </div>

          {/* Only show creator address in ongoing or completed state */}
          {(isOngoing || isCompleted) && event.creator_address && (
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-secondary">
                Creator address:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleAddressClick}
                  className="text-xs md:text-sm text-black dark:text-white font-mono border-b border-dashed border-black 
                  dark:border-white hover:border-gray-500 dark:hover:border-gray-400 transition-colors cursor-pointer hover:text-gray-500 dark:hover:text-gray-400"
                  aria-label="Search events by creator address"
                >
                  {event.creator_address.length > 10
                    ? `${event.creator_address.slice(
                        0,
                        6
                      )}...${event.creator_address.slice(-4)}`
                    : event.creator_address}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCreatorAddress}
                  className="flex items-center justify-center p-1 hover:bg-surface-hover rounded transition-colors text-secondary hover:text-primary !cursor-pointer"
                  aria-label="Copy creator address"
                >
                  <CopyIcon className="w-4 h-4 text-current" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {/* Only show event duration in ongoing or completed state */}
          {(isOngoing || isCompleted) && eventDurationDisplay && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                Duration of This Event:
              </span>
              <span className="text-xs md:text-sm text-primary ml-2">
                {eventDurationDisplay}
              </span>
            </div>
          )}

          {/* Show preheat duration in all states if it exists */}
          {preheatDurationDisplay && (
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
            <span className="text-xs md:text-sm text-secondary">Event-ID:</span>
            <span className="text-xs md:text-sm text-primary ml-2">
              {event.event_id}
            </span>
          </div>

          {event.hashtags && event.hashtags.length > 0 && (
            <div>
              <span className="text-xs md:text-sm text-secondary">
                {event.hashtags.length > 1 ? "Hashtags:" : "Hashtag:"}
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {event.hashtags.map((tag, index) => {
                  const hashtagWithPrefix = tag.startsWith("#")
                    ? tag
                    : `#${tag}`;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleHashtagClick(tag)}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 dark:bg-white text-black text-xs md:text-sm hover:bg-gray-300 dark:hover:bg-gray-100 transition-colors cursor-pointer"
                      aria-label={`Filter by ${hashtagWithPrefix}`}
                    >
                      {hashtagWithPrefix}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Ordered List */}
      <div className="md:hidden flex flex-col gap-3">
        {mobileFields.map((field) => (
          <div key={field.key}>
            <span className="text-xs text-secondary">{field.label}</span>
            <div className="mt-1">{field.value}</div>
          </div>
        ))}
      </div>

      {/* Top Reply / Options */}
      {displayData.length > 0 && displayTitle && (
        <div>
          <h2 className="text-sm md:text-base font-semibold text-primary mb-3">
            {displayTitle}
          </h2>
          <div className="space-y-2">
            {(isExpanded ? displayData : displayData.slice(0, 2)).map(
              (reply, index) => (
                <TopReplyBar key={reply.id || index} reply={reply} />
              )
            )}
          </div>
          {hasMore && (
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs md:text-sm text-secondary 
               hover:underline cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  {isExpanded ? "Show less" : "Show more"}{" "}
                  {isExpanded ? (
                    <ArrowUpIcon className="w-3 h-3" />
                  ) : (
                    <ArrowDownIcon className="w-3 h-3" />
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      <div className="flex md:justify-end">
        <EventCTAButton
          status={event.status}
          eventRewardType={event.event_reward_type}
          eventId={event.event_id}
        />
      </div>
    </div>
  );
}
