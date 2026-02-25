import { useToast } from "@/components/base/Toast/useToast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
// import { Button } from "@/components/base/Button";
import type { EventDetailDataRes, EventOption } from "@/api/response";
import { EventStatus } from "@/api/types";
import CopyIcon from "@/assets/icons/copy.svg?react";
import type { TopReply } from "@/pages/create-event/types";
import { useHomeStore } from "@/stores/homeStore";
import {
  formatCompletedTime,
  formatEventDuration,
  formatOngoingCountdown,
  formatPreheatCountdown,
  formatPreheatDuration,
  satsToBtc,
} from "@/utils/formatter";
import { useDebouncedClick } from "@/utils/helper";
import { EventCTAButton } from "./EventCTAButton";
import { TopReplyBar } from "./TopReplyBar";

interface EventInfoProps {
  event: EventDetailDataRes;
  topReplies?: TopReply[];
}

export function EventInfo({ event, topReplies }: EventInfoProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setActiveHashtag, setStatus, setSearch, setDebouncedSearch } =
    useHomeStore();

  // Debounced copy handler for creator address
  const handleCopyCreatorAddress = useDebouncedClick(async () => {
    if (event.creator_address) {
      try {
        await navigator.clipboard.writeText(event.creator_address);
        showToast("success", t("eventInfo.addressCopied", "Address copied"));
      } catch {
        showToast("error", t("eventInfo.failedToCopy", "Failed to copy"));
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
  const isCompleted =
    event.status === EventStatus.ENDED ||
    event.status === EventStatus.COMPLETED;
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
    [isPreheat, isOngoing, isCompleted, setStatus, setActiveHashtag, navigate],
  );

  // Reward calculations
  const rewardAmountBtc = useMemo(
    () => satsToBtc(event.initial_reward_satoshi, { suffix: false }),
    [event.initial_reward_satoshi],
  );

  const additionalRewardBtc = useMemo(() => {
    if (event.additional_reward_satoshi <= 0) return null;
    return satsToBtc(event.additional_reward_satoshi, { suffix: false });
  }, [event.additional_reward_satoshi]);

  // Duration calculations
  const eventDurationDisplay = useMemo(() => {
    if (isOngoing || isCompleted || isPreheat) {
      return formatEventDuration(event.started_at, event.deadline_at, t);
    }
    return null;
  }, [
    isOngoing,
    isCompleted,
    isPreheat,
    event.started_at,
    event.deadline_at,
    t,
  ]);

  const preheatDurationDisplay = useMemo(() => {
    if (event.preheat_hours > 0) {
      return formatPreheatDuration(event.preheat_hours, t);
    }
    return null;
  }, [event.preheat_hours, t]);

  // Time remaining with real-time updates
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (isPreheat) {
      return formatPreheatCountdown(event.started_at, t);
    }
    if (isOngoing) {
      return formatOngoingCountdown(event.deadline_at, t);
    }
    if (isCompleted) {
      return formatCompletedTime(
        event.deadline_at,
        t("eventInfo.eventEndedOn", "Ended on"),
      );
    }
    return "";
  });

  useEffect(() => {
    if (isCompleted) {
      // Completed state doesn't need countdown
      setTimeRemaining(
        formatCompletedTime(
          event.deadline_at,
          t("eventInfo.eventEndedOn", "Ended on"),
        ),
      );
      return;
    }

    const updateTimeRemaining = () => {
      if (isPreheat) {
        setTimeRemaining(formatPreheatCountdown(event.started_at, t));
      } else if (isOngoing) {
        setTimeRemaining(formatOngoingCountdown(event.deadline_at, t));
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [
    t,
    isPreheat,
    isOngoing,
    isCompleted,
    event.started_at,
    event.preheat_hours,
    event.deadline_at,
  ]);

  // Prepare data for Top Reply/Options display
  const { displayData, displayTitle } = useMemo(() => {
    const isSingleChoice = event.event_type === "single_choice";
    const isOpen = event.event_type === "open";

    // PREHEAT + single_choice: Show Options
    if (isPreheat && isSingleChoice) {
      if (!event.options || event.options.length === 0) {
        return { displayData: [], displayTitle: "", hasMore: false };
      }

      // Filter out string options, only use EventOption objects
      const validOptions = (event.options as (EventOption | string)[]).filter(
        (opt): opt is EventOption => typeof opt === "object" && "id" in opt,
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

      const title =
        validOptions.length > 1
          ? t("eventInfo.options", "Options")
          : t("eventInfo.option", "Option");
      return {
        displayData: convertedData,
        displayTitle: title,
      };
    }

    // ACTIVE/COMPLETED + single_choice: Show Options or Top Reply
    if ((isOngoing || isCompleted) && isSingleChoice) {
      if (!event.options || event.options.length === 0) {
        return { displayData: [], displayTitle: "", hasMore: false };
      }

      const validOptions = (event.options as (EventOption | string)[]).filter(
        (opt): opt is EventOption => typeof opt === "object" && "id" in opt,
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

      const title = hasReplies
        ? t("eventInfo.topReply", "Top Reply")
        : t("eventInfo.options", "Options");
      return {
        displayData:
          topReplies && topReplies.length > 0 ? topReplies : convertedData,
        displayTitle: title,
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
      const replies =
        topReplies && topReplies.length > 0 ? topReplies : event.top_replies;
      const sortedReplies = [...replies]
        .sort((a, b) => {
          const weightA = a.weight_percent || 0;
          const weightB = b.weight_percent || 0;
          return weightB - weightA;
        })
        .slice(0, 5);

      return {
        displayData: sortedReplies,
        displayTitle: t("eventInfo.topReply", "Top Reply"),
      };
    }

    return { displayData: [], displayTitle: "" };
  }, [
    t,
    event.event_type,
    event.options,
    event.top_replies,
    isPreheat,
    isOngoing,
    isCompleted,
    topReplies,
  ]);

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
        label: t("eventInfo.rewardAmount", "Reward Amount:"),
        value: (
          <span className="text-primary text-xs font-semibold md:text-sm">
            {rewardAmountBtc} BTC ({event.winner_count}{" "}
            {event.winner_count === 1
              ? t("eventInfo.address", "Address")
              : t("eventInfo.addresses", "Addresses")}
            )
          </span>
        ),
      });
    }

    if ((isOngoing || isCompleted) && isRewarded && additionalRewardBtc) {
      fields.push({
        key: "additional-reward",
        label: t("eventInfo.additionalReward", "Additional Reward:"),
        value: (
          <span className="text-primary text-xs md:text-sm">
            {additionalRewardBtc} BTC ({event.additional_winner_count}{" "}
            {event.additional_winner_count === 1
              ? t("eventInfo.address", "Address")
              : t("eventInfo.addresses", "Addresses")}
            )
          </span>
        ),
      });
    }

    fields.push({
      key: "time-remaining",
      label: t("eventInfo.timeRemaining", "Time Remaining:"),
      value: isCompleted ? (
        <div className="mt-1 text-xs font-semibold text-black md:text-sm dark:text-white">
          {timeRemaining}
        </div>
      ) : (
        <span className="text-accent text-xs font-semibold md:text-sm">
          {timeRemaining}
        </span>
      ),
    });

    // Only show event duration in ongoing or completed state
    if ((isOngoing || isCompleted || isPreheat) && eventDurationDisplay) {
      fields.push({
        key: "duration",
        label: t("eventInfo.durationOfEvent", "Duration of This Event:"),
        value: (
          <span className="text-primary text-xs md:text-sm">
            {eventDurationDisplay}
          </span>
        ),
      });
    }

    if (preheatDurationDisplay) {
      fields.push({
        key: "preheat-duration",
        label: t("eventInfo.preheatDuration", "Preheat Duration:"),
        value: (
          <span className="text-primary text-xs md:text-sm">
            {preheatDurationDisplay}
          </span>
        ),
      });
    }

    fields.push({
      key: "event-id",
      label: t("eventInfo.eventId", "Event-ID:"),
      value: (
        <span className="text-primary text-xs md:text-sm">
          {event.event_id}
        </span>
      ),
    });

    // Only show creator address in ongoing or completed state
    if ((isOngoing || isCompleted || isPreheat) && event.creator_address) {
      fields.push({
        key: "creator-address",
        label: t("eventInfo.creatorAddress", "Creator address:"),
        value: (
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddressClick}
              className="cursor-pointer border-b border-dashed border-black font-mono text-xs text-black transition-colors hover:border-gray-500 hover:text-gray-500 md:text-sm dark:border-white dark:text-white dark:hover:border-gray-400 dark:hover:text-gray-400"
              aria-label={t(
                "eventInfo.searchByCreatorAddress",
                "Search events by creator address",
              )}
            >
              {event.creator_address.length > 10
                ? `${event.creator_address.slice(
                    0,
                    6,
                  )}...${event.creator_address.slice(-4)}`
                : event.creator_address}
            </button>
            <button
              type="button"
              onClick={handleCopyCreatorAddress}
              className="hover:bg-surface-hover text-secondary hover:text-primary flex cursor-pointer! items-center justify-center rounded p-1 transition-colors"
              aria-label={t(
                "eventInfo.copyCreatorAddress",
                "Copy creator address",
              )}
            >
              <CopyIcon className="h-4 w-4 text-current" />
            </button>
          </div>
        ),
      });
    }

    fields.push({
      key: "response-type",
      label: t("eventInfo.eventType", "Response type:"),
      value: (
        <span className="text-xs">
          {event.event_type === "open"
            ? t("reply.openEnded", "Open-ended")
            : t("reply.singleChoice", "Multiple choice")}
        </span>
      ),
    });

    if (event.hashtags && event.hashtags.length > 0) {
      fields.push({
        key: "hashtags",
        label:
          event.hashtags.length > 1
            ? t("eventInfo.hashtags", "Hashtags:")
            : t("eventInfo.hashtag", "Hashtag:"),
        value: (
          <div className="mt-1 flex flex-wrap gap-2">
            {event.hashtags.map((tag, index) => {
              const hashtagWithPrefix = tag.startsWith("#") ? tag : `#${tag}`;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleHashtagClick(tag)}
                  className="inline-flex cursor-pointer items-center rounded-full bg-gray-200 px-3 py-1 text-xs text-black transition-colors hover:bg-gray-300 md:text-sm dark:bg-white dark:hover:bg-gray-100"
                  aria-label={t(
                    "eventInfo.filterByHashtag",
                    "Filter by {{hashtag}}",
                    {
                      hashtag: hashtagWithPrefix,
                    },
                  )}
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
    isPreheat,
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
    event.event_type,
    event.hashtags,
    handleAddressClick,
    handleHashtagClick,
    handleCopyCreatorAddress,
    t,
  ]);

  // Description expand/collapse
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showDescriptionToggle, setShowDescriptionToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkDescriptionOverflow = () => {
      if (!descriptionRef.current) return;

      const computedStyle = window.getComputedStyle(descriptionRef.current);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) ||
        parseFloat(computedStyle.fontSize) * 1.5;

      const clone = descriptionRef.current.cloneNode(true) as HTMLElement;
      clone.className = descriptionRef.current.className.replace(
        "line-clamp-2",
        "",
      );
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.width = `${descriptionRef.current.offsetWidth}px`;
      clone.style.whiteSpace = "pre-line";
      clone.style.wordBreak = "break-word";
      clone.style.overflow = "visible";
      clone.style.height = "auto";
      clone.style.maxHeight = "none";

      document.body.appendChild(clone);
      const fullHeight = clone.scrollHeight;
      document.body.removeChild(clone);

      const clampedHeight = descriptionRef.current.clientHeight;
      const expectedHeight = lineHeight * 2;
      const TOLERANCE = 2;

      const isOverflowing =
        fullHeight > expectedHeight + TOLERANCE ||
        fullHeight > clampedHeight + TOLERANCE;

      setShowDescriptionToggle(isOverflowing || isDescriptionExpanded);
    };

    const timer = setTimeout(checkDescriptionOverflow, 0);
    window.addEventListener("resize", checkDescriptionOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkDescriptionOverflow);
    };
  }, [event.description, isDescriptionExpanded]);

  return (
    <div className="flex flex-col gap-6">
      {/* Title and Copy Link */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-primary min-w-0 flex-1 text-2xl font-semibold wrap-break-word md:text-3xl">
          {event.title}
        </h1>
      </div>

      {/* Description */}
      {event.description && (
        <div>
          <p
            ref={descriptionRef}
            className={`text-secondary min-w-0 text-sm leading-relaxed wrap-break-word whitespace-pre-line md:text-base ${
              isDescriptionExpanded ? "" : "line-clamp-2"
            }`}
          >
            {event.description}
          </p>
          {showDescriptionToggle && (
            <button
              type="button"
              className="mt-1 cursor-pointer text-xs md:text-sm"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {isDescriptionExpanded
                ? t("eventCard.showLess", "Show less")
                : t("eventCard.showMore", "Show more")}
            </button>
          )}
        </div>
      )}

      {/* Top Reply / Options */}
      {displayData.length > 0 && displayTitle && (
        <div>
          <h2 className="text-primary mb-3 text-sm font-semibold md:text-base">
            {displayTitle}
          </h2>
          <div className="space-y-2">
            {displayData.map((reply, index) => (
              <TopReplyBar key={reply.id || index} reply={reply} />
            ))}
          </div>
        </div>
      )}

      {/* Desktop: Two Column Layout */}
      <div className="hidden grid-cols-2 gap-4 md:grid md:gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {/* Only show rewards in ongoing or completed state */}
          {(isOngoing || isCompleted) && isRewarded && rewardAmountBtc && (
            <div>
              <span className="text-secondary text-xs md:text-sm">
                {t("eventInfo.rewardAmount", "Reward Amount:")}
              </span>
              <span className="text-primary ml-2 text-xs font-semibold md:text-sm">
                {rewardAmountBtc} BTC ({event.winner_count}{" "}
                {event.winner_count === 1
                  ? t("eventInfo.address", "Address")
                  : t("eventInfo.addresses", "Addresses")}
                )
              </span>
            </div>
          )}

          {(isOngoing || isCompleted) && isRewarded && additionalRewardBtc && (
            <div>
              <span className="text-secondary text-xs md:text-sm">
                {t("eventInfo.additionalReward", "Additional Reward:")}
              </span>
              <span className="text-primary ml-2 text-xs md:text-sm">
                {additionalRewardBtc} BTC ({event.additional_winner_count}{" "}
                {event.additional_winner_count === 1
                  ? t("eventInfo.address", "Address")
                  : t("eventInfo.addresses", "Addresses")}
                )
              </span>
            </div>
          )}

          <div>
            <span className="text-secondary text-xs md:text-sm">
              {t("eventInfo.timeRemaining", "Time Remaining:")}
            </span>
            {isCompleted ? (
              <div className="mt-1 text-xs text-black md:text-sm dark:text-white">
                {timeRemaining}
              </div>
            ) : (
              <span className="text-accent ml-2 text-xs font-semibold md:text-sm">
                {timeRemaining}
              </span>
            )}
          </div>

          {/* Show creator address in all states */}
          {(isPreheat || isOngoing || isCompleted) && event.creator_address && (
            <div className="flex items-center gap-2">
              <span className="text-secondary text-xs md:text-sm">
                {t("eventInfo.creatorAddress", "Creator address:")}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddressClick}
                  className="cursor-pointer border-b border-dashed border-black font-mono text-xs text-black transition-colors hover:border-gray-500 hover:text-gray-500 md:text-sm dark:border-white dark:text-white dark:hover:border-gray-400 dark:hover:text-gray-400"
                  aria-label={t(
                    "eventInfo.searchByCreatorAddress",
                    "Search events by creator address",
                  )}
                >
                  {event.creator_address.length > 10
                    ? `${event.creator_address.slice(
                        0,
                        6,
                      )}...${event.creator_address.slice(-4)}`
                    : event.creator_address}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCreatorAddress}
                  className="hover:bg-surface-hover text-secondary hover:text-primary flex cursor-pointer! items-center justify-center rounded p-1 transition-colors"
                  aria-label={t(
                    "eventInfo.copyCreatorAddress",
                    "Copy creator address",
                  )}
                >
                  <CopyIcon className="h-4 w-4 text-current" />
                </button>
              </div>
            </div>
          )}

          <div>
            <span className="text-secondary text-xs md:text-sm">
              {t("eventInfo.eventType", "Event Type:")}
            </span>
            <span className="ml-2 text-xs text-black md:text-sm dark:text-white">
              {event.event_type === "open"
                ? t("reply.openEnded", "Open-ended")
                : t("reply.singleChoice", "Multiple choice")}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {/* Only show event duration in ongoing or completed state */}
          {(isOngoing || isCompleted || isPreheat) && eventDurationDisplay && (
            <div>
              <span className="text-secondary text-xs md:text-sm">
                {t("eventInfo.durationOfEvent", "Duration of This Event:")}
              </span>
              <span className="text-primary ml-2 text-xs md:text-sm">
                {eventDurationDisplay}
              </span>
            </div>
          )}

          {/* Show preheat duration in all states if it exists */}
          {preheatDurationDisplay && (
            <div>
              <span className="text-secondary text-xs md:text-sm">
                {t("eventInfo.preheatDuration", "Preheat Duration:")}
              </span>
              <span className="text-primary ml-2 text-xs md:text-sm">
                {preheatDurationDisplay}
              </span>
            </div>
          )}

          <div>
            <span className="text-secondary text-xs md:text-sm">
              {t("eventInfo.eventId", "Event-ID:")}
            </span>
            <span className="text-primary ml-2 text-xs md:text-sm">
              {event.event_id}
            </span>
          </div>

          {event.hashtags && event.hashtags.length > 0 && (
            <div>
              <span className="text-secondary text-xs md:text-sm">
                {event.hashtags.length > 1
                  ? t("eventInfo.hashtags", "Hashtags:")
                  : t("eventInfo.hashtag", "Hashtag:")}
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {event.hashtags.map((tag, index) => {
                  const hashtagWithPrefix = tag.startsWith("#")
                    ? tag
                    : `#${tag}`;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleHashtagClick(tag)}
                      className="inline-flex cursor-pointer items-center rounded-full bg-gray-200 px-3 py-1 text-xs text-black transition-colors hover:bg-gray-300 md:text-sm dark:bg-white dark:hover:bg-gray-100"
                      aria-label={t(
                        "eventInfo.filterByHashtag",
                        "Filter by {{hashtag}}",
                        { hashtag: hashtagWithPrefix },
                      )}
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
      <div className="flex flex-col gap-3 md:hidden">
        {mobileFields.map((field) => (
          <div key={field.key}>
            <span className="text-secondary text-xs">{field.label}</span>
            <div className="mt-1">{field.value}</div>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className="flex md:justify-end">
        <EventCTAButton
          status={event.status}
          eventRewardType={event.event_reward_type}
          eventId={event.event_id}
          totalRewardAmount={event.total_reward_satoshi}
        />
      </div>
    </div>
  );
}
