import { useToast } from "@/components/base/Toast/useToast";
import { Button, Tooltip } from "antd";
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

const UNLOCK_LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

interface EventInfoProps {
  event: EventDetailDataRes;
  topReplies?: TopReply[];
  isTopRepliesLoading?: boolean;
  isLocked?: boolean;
  isCreator?: boolean;
  creatorEmail?: string;
}

export function EventInfo({
  event,
  topReplies,
  isTopRepliesLoading,
  isLocked,
  isCreator,
  creatorEmail,
}: EventInfoProps) {
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

  const isPreheat = event.status === EventStatus.PREHEAT;
  const isOngoing = event.status === EventStatus.ACTIVE;
  const isCompleted =
    event.status === EventStatus.ENDED ||
    event.status === EventStatus.COMPLETED;
  const isRewarded = event.event_reward_type === "rewarded";

  // Handle options click - navigate to reply page when event is active
  const handleOptionsClick = useCallback(() => {
    if (isOngoing) {
      navigate(`/event/${event.event_id}/reply`);
    }
  }, [isOngoing, event.event_id, navigate]);

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
          topReplies && topReplies.length > 0
            ? topReplies
            : isTopRepliesLoading
              ? []
              : convertedData,
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
      // When loading, don't fall back to stale event.top_replies
      const replies =
        topReplies && topReplies.length > 0
          ? topReplies
          : isTopRepliesLoading
            ? []
            : event.top_replies;
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
    isTopRepliesLoading,
  ]);

  // Show skeleton only on initial load (no existing data), not during refetch
  const showSkeleton = !!isTopRepliesLoading && displayData.length === 0;

  // For single_choice, use exact option count to prevent layout shift
  const skeletonCount =
    event.event_type === "single_choice" && event.options?.length
      ? event.options.length
      : 2;

  // Build unified field list
  const fields = useMemo(() => {
    type Field = { label: string; value: React.ReactNode; key: string };
    const result: Field[] = [];

    result.push({
      key: "time-remaining",
      label: t("eventInfo.timeRemaining", "Time Remaining:"),
      value: (
        <div className="text-primary text-xs font-semibold md:text-sm">
          {timeRemaining}
        </div>
      ),
    });

    if ((isOngoing || isCompleted) && isRewarded && rewardAmountBtc) {
      result.push({
        key: "reward-amount",
        label: t("eventInfo.rewardAmount", "Reward Amount:"),
        value: (
          <span className="text-primary text-xs font-semibold md:text-sm">
            <span className="text-accent mr-2">
              {Number(rewardAmountBtc)} BTC
            </span>
            ({event.winner_count}{" "}
            {event.winner_count === 1
              ? t("eventInfo.address", "Address")
              : t("eventInfo.addresses", "Addresses")}
            )
          </span>
        ),
      });
    }

    if ((isOngoing || isCompleted) && isRewarded && additionalRewardBtc) {
      result.push({
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

    if ((isOngoing || isCompleted || isPreheat) && event.creator_address) {
      result.push({
        key: "creator-address",
        label: t("eventInfo.creatorAddress", "Creator address:"),
        value: (
          <div className="flex items-center gap-2">
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
                ? `${event.creator_address.slice(0, 6)}...${event.creator_address.slice(-4)}`
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

    if (preheatDurationDisplay) {
      result.push({
        key: "preheat-duration",
        label: t("eventInfo.preheatDuration", "Preheat Duration:"),
        value: (
          <span className="text-primary text-xs md:text-sm">
            {preheatDurationDisplay}
          </span>
        ),
      });
    }

    if (eventDurationDisplay) {
      result.push({
        key: "duration",
        label: t("eventInfo.durationOfEvent", "Duration of This Event:"),
        value: (
          <span className="text-primary text-xs md:text-sm">
            {eventDurationDisplay}
          </span>
        ),
      });
    }

    result.push({
      key: "event-id",
      label: t("eventInfo.eventId", "Event-ID:"),
      value: (
        <span className="text-primary text-xs md:text-sm">
          {event.event_id}
        </span>
      ),
    });

    result.push({
      key: "response-type",
      label: t("eventInfo.eventType", "Response type:"),
      value: (
        <span className="text-xs md:text-sm">
          {event.event_type === "open"
            ? t("reply.openEnded", "Open-ended")
            : t("reply.singleChoice", "Multiple choice")}
        </span>
      ),
    });

    if (event.result_visibility) {
      const isWithin24hOfUnlock = event.last_unlock_confirmed_at
        ? Date.now() - new Date(event.last_unlock_confirmed_at).getTime() <=
          UNLOCK_LOCK_DURATION_MS
        : false;
      const showChangeButton =
        isCreator && event.result_visibility !== "public";
      result.push({
        key: "result-visibility",
        label: t("eventInfo.resultVisibility", "Result visibility:"),
        value: (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm">
              {event.result_visibility === "public"
                ? t("reply.resultVisibilityPublic", "Public")
                : event.result_visibility === "paid_only"
                  ? t("reply.resultVisibilityPaidOnly", "Paid-only")
                  : t("reply.resultVisibilityCreatorOnly", "Creator-only")}
            </span>
            {showChangeButton && (
              <Tooltip
                title={
                  isWithin24hOfUnlock
                    ? t(
                        "eventInfo.resultVisibilityLockedTooltip",
                        "Visibility changes are locked for 24 hours after the most recent paid unlock.",
                      )
                    : undefined
                }
              >
                <Button
                  type="default"
                  className="h-6! px-2!"
                  autoInsertSpace={false}
                  disabled={isWithin24hOfUnlock}
                  onClick={() =>
                    navigate(
                      `/event/${event.event_id}/change-result-visibility`,
                      {
                        state: {
                          creatorEmail,
                          currentVisibility: event.result_visibility,
                        },
                      },
                    )
                  }
                >
                  {t("common.change", "Change")}
                </Button>
              </Tooltip>
            )}
          </div>
        ),
      });
    }

    if (event.hashtags && event.hashtags.length > 0) {
      result.push({
        key: "hashtags",
        label:
          event.hashtags.length > 1
            ? t("eventInfo.hashtags", "Hashtags:")
            : t("eventInfo.hashtag", "Hashtag:"),
        value: (
          <div className="flex flex-wrap gap-2">
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
                    { hashtag: hashtagWithPrefix },
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

    return result;
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
    event.result_visibility,
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
      {/* When locked (non-public) + open: hide entirely. When locked + single_choice: show names only. */}
      {!(
        isLocked &&
        event.result_visibility !== "public" &&
        event.event_type === "open"
      ) &&
        (showSkeleton || (displayData.length > 0 && !!displayTitle)) && (
          <div
            onClick={
              !showSkeleton && isOngoing ? handleOptionsClick : undefined
            }
            className={!showSkeleton && isOngoing ? "cursor-pointer" : ""}
          >
            <h2 className="text-primary mb-3 text-sm font-semibold md:text-base">
              {showSkeleton
                ? t("eventInfo.topReply", "Top Reply")
                : displayTitle}
            </h2>
            <div className="space-y-2">
              {showSkeleton
                ? [...Array(skeletonCount)].map((_, i) => (
                    <div
                      key={i}
                      className="border-border bg-surface h-14 w-full animate-pulse rounded-lg border"
                    />
                  ))
                : displayData.map((reply, index) =>
                    isLocked && event.result_visibility !== "public" ? (
                      <div
                        key={reply.id || index}
                        className="border-border bg-bg flex h-14 w-full items-center rounded-lg border px-4"
                      >
                        <span className="text-primary line-clamp-1 flex-1 text-sm md:text-base">
                          {reply.body}
                        </span>
                      </div>
                    ) : (
                      <TopReplyBar key={reply.id || index} reply={reply} />
                    ),
                  )}
            </div>
          </div>
        )}

      {/* Responsive Two-Column Layout */}
      <div className="flex flex-wrap gap-3 md:gap-6">
        {fields.map((field) => (
          <div key={field.key} className="w-full md:w-[calc(50%-0.75rem)]">
            <span className="text-secondary text-xs md:text-sm">
              {field.label}
            </span>
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
