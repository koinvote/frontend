import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import type {
  EventDetailDataRes,
  GetCompletedTopRepliesRes,
} from "@/api/response";
import { EventStatus, ReplySortBy } from "@/api/types";
import BackButton from "@/components/base/BackButton";
import { PageLoading } from "@/components/PageLoading";
import { useBackOrFallback } from "@/hooks/useBack";
import { mapApiTopReply } from "@/utils/eventTransform";
import { Divider } from "./components/Divider";
import { EventInfo } from "./components/EventInfo";
import { ReplyList } from "./components/ReplyList";
import { SearchAndFilter } from "./components/SearchAndFilter";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const initialUnlockEmail = (location.state as { unlockEmail?: string } | null)
    ?.unlockEmail;
  const { t } = useTranslation();
  const hasRestoredScroll = useRef(false);
  const isRestoringRef = useRef(false);
  const goBack = useBackOrFallback("/");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME
  >(ReplySortBy.TIME);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [isRepliesLocked, setIsRepliesLocked] = useState(false);

  const {
    data: eventDetail,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = (await API.getEventDetail(
        eventId,
      )()) as unknown as ApiResponse<EventDetailDataRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch event detail");
      }
      return response.data;
    },
    enabled: !!eventId,
  });

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const [balanceDisplayMode, setBalanceDisplayMode] = useState<
    "snapshot" | "on_chain"
  >("snapshot");

  // For active events, always use on_chain without waiting for a useEffect to update state.
  // This ensures the top-replies query fires immediately when eventDetail loads,
  // preventing the stale 2-item preview from briefly showing.
  const effectiveBalanceDisplayMode =
    eventDetail?.status === EventStatus.ACTIVE
      ? "on_chain"
      : balanceDisplayMode;

  const isTopRepliesEnabled =
    !!eventId && !!eventDetail && eventDetail.status !== EventStatus.PREHEAT;

  const { data: topRepliesData, isLoading: isTopRepliesLoading } = useQuery({
    queryKey: [
      "completedTopReplies",
      eventId,
      effectiveBalanceDisplayMode === "on_chain" ? "current" : "snapshot",
    ],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const balanceType =
        effectiveBalanceDisplayMode === "on_chain" ? "current" : "snapshot";
      const response = (await API.getCompletedTopReplies(eventId)({
        balance_type: balanceType,
      })) as unknown as ApiResponse<GetCompletedTopRepliesRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch top replies");
      }
      return response.data;
    },
    enabled: isTopRepliesEnabled,
  });

  // When the query is enabled but hasn't resolved yet, pass empty array to prevent
  // stale eventDetail.top_replies (preview data) from flashing before real data arrives.
  const displayTopReplies = topRepliesData?.top_replies
    ? topRepliesData.top_replies.map(mapApiTopReply)
    : isTopRepliesEnabled
      ? []
      : (eventDetail?.top_replies ?? []);

  // Save scroll position on scroll
  useEffect(() => {
    if (!eventId) return;

    const scrollKey = `event-detail-scroll-${eventId}`;
    let scrollTimer: number | null = null;

    const handleScroll = () => {
      if (isRestoringRef.current || scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        sessionStorage.setItem(scrollKey, window.scrollY.toString());
        scrollTimer = null;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [eventId]);

  // Restore scroll position after data is loaded
  useEffect(() => {
    if (
      !eventId ||
      isLoadingEvent ||
      !eventDetail ||
      hasRestoredScroll.current
    ) {
      return;
    }

    hasRestoredScroll.current = true;
    const scrollKey = `event-detail-scroll-${eventId}`;
    const savedScrollY = sessionStorage.getItem(scrollKey);

    if (savedScrollY && savedScrollY !== "0") {
      const scrollY = parseInt(savedScrollY, 10);
      if (!isNaN(scrollY) && scrollY > 0) {
        isRestoringRef.current = true;

        const tryScroll = () => {
          const docHeight = document.documentElement.scrollHeight;
          if (docHeight >= scrollY - 50) {
            window.scrollTo(0, scrollY);
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 500);
            return true;
          }
          return false;
        };

        // Try immediately
        if (!tryScroll()) {
          // Use ResizeObserver to wait for document to grow
          const observer = new ResizeObserver(() => {
            if (tryScroll()) {
              observer.disconnect();
            }
          });
          observer.observe(document.documentElement);

          // Fallback timeout
          setTimeout(() => {
            observer.disconnect();
            tryScroll();
          }, 3000);
        }
      }
    }
  }, [eventId, isLoadingEvent, eventDetail]);

  // Reset restore flag when eventId changes
  useEffect(() => {
    hasRestoredScroll.current = false;
  }, [eventId]);

  useEffect(() => {
    if (eventDetail?.title) {
      document.title = `${eventDetail.title} | Koinvote`;
    }
  }, [eventDetail?.title]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handleSortChange = (
    newSortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME,
    newOrder: "desc" | "asc",
  ) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
  };

  if (isLoadingEvent) {
    return <PageLoading />;
  }

  if (eventError || !eventDetail) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-2 text-lg">Failed to load event</p>
          <p className="text-secondary text-sm">
            {eventError instanceof Error ? eventError.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center px-2 md:px-0">
      <div className="relative h-[50px] w-full max-w-3xl">
        <BackButton onClick={goBack} />
      </div>
      <div className="border-gray-450 bg-bg w-full max-w-3xl rounded-3xl border px-6 py-6 md:px-8 md:py-8">
        {/* First Section: Event Info */}
        <EventInfo
          event={eventDetail}
          topReplies={displayTopReplies}
          isTopRepliesLoading={isTopRepliesEnabled && isTopRepliesLoading}
        />
        {/* Divider */}
        <div className="my-6 md:my-8">
          <Divider />
        </div>

        {!isRepliesLocked && eventDetail.unlock_price_satoshi && (
          <div className="mb-6">
            <div className="text-secondary text-xs md:text-sm">
              {t("eventInfo.unlockPrice", "Unlock Price")}
            </div>
            <div className="text-primary mt-2 text-xs md:text-sm">
              {eventDetail.unlock_price_satoshi / 100000000} BTC
            </div>
          </div>
        )}

        {/* Second Section: Search and Filter */}
        {!isRepliesLocked && (
          <SearchAndFilter
            eventId={eventId!}
            eventStatus={eventDetail.status}
            balanceDisplayMode={effectiveBalanceDisplayMode}
            onBalanceDisplayModeChange={setBalanceDisplayMode}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
          />
        )}

        <div className="h-4" />

        {/* Third Section: Reply List */}
        <ReplyList
          eventId={eventId!}
          initialUnlockEmail={initialUnlockEmail}
          eventStatus={eventDetail.status}
          balanceDisplayMode={effectiveBalanceDisplayMode}
          search={search}
          sortBy={sortBy}
          order={order}
          options={eventDetail.options}
          eventType={eventDetail.event_type}
          unlockPriceSatoshi={eventDetail.unlock_price_satoshi}
          unlockCount={eventDetail.unlock_count}
          participantsCount={eventDetail.participants_count}
          totalStakeSatoshi={eventDetail.total_stake_satoshi}
          eventTitle={eventDetail.title}
          onLockedChange={setIsRepliesLocked}
        />
      </div>
    </div>
  );
};

export default EventDetail;
