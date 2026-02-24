import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { API, type ApiResponse } from "@/api";
import type {
  EventDetailDataRes,
  GetCompletedTopRepliesRes,
} from "@/api/response";
import { EventStatus, ReplySortBy } from "@/api/types";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";
import { PageLoading } from "@/components/PageLoading";
import { useBackOrFallback } from "@/hooks/useBack";
import { mapApiTopReply } from "@/utils/eventTransform";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "./components/Divider";
import { EventInfo } from "./components/EventInfo";
import { ReplyList } from "./components/ReplyList";
import { SearchAndFilter } from "./components/SearchAndFilter";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const hasRestoredScroll = useRef(false);
  const isRestoringRef = useRef(false);
  const goBack = useBackOrFallback("/");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME
  >(ReplySortBy.BALANCE);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

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

  // Fetch top replies/options when balance display mode changes for completed/ended events
  const { data: topRepliesData } = useQuery({
    queryKey: [
      "completedTopReplies",
      eventId,
      balanceDisplayMode === "on_chain" ? "current" : "snapshot",
    ],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const balanceType =
        balanceDisplayMode === "on_chain" ? "current" : "snapshot";
      const response = (await API.getCompletedTopReplies(eventId)({
        balance_type: balanceType,
      })) as unknown as ApiResponse<GetCompletedTopRepliesRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch top replies");
      }
      return response.data;
    },
    enabled:
      !!eventId && !!eventDetail && eventDetail.status !== EventStatus.PREHEAT,
  });

  // Merge data from top replies API with event detail
  // Convert TopReplyRes to TopReply format using mapApiTopReply
  const displayTopReplies = topRepliesData?.top_replies
    ? topRepliesData.top_replies.map(mapApiTopReply)
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
    if (eventDetail?.status === EventStatus.ACTIVE) {
      setBalanceDisplayMode("on_chain");
    }
  }, [eventDetail?.status]);

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
      <div className="relative h-[50px] w-full">
        <button
          type="button"
          className="hover:text-admin-text-sub absolute left-0 cursor-pointer text-black dark:text-white"
          onClick={goBack}
        >
          <CircleLeftIcon className="h-8 w-8 fill-current" />
        </button>
      </div>
      <div className="border-gray-450 bg-bg w-full max-w-3xl rounded-3xl border px-6 py-6 md:px-8 md:py-8">
        {/* First Section: Event Info */}
        <EventInfo event={eventDetail} topReplies={displayTopReplies} />
        {/* Divider */}
        <div className="my-6 md:my-8">
          <Divider />
        </div>

        {/* Second Section: Search and Filter */}
        <SearchAndFilter
          eventId={eventId!}
          eventStatus={eventDetail.status}
          balanceDisplayMode={balanceDisplayMode}
          onBalanceDisplayModeChange={setBalanceDisplayMode}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
        />

        <div className="h-4" />

        {/* Third Section: Reply List */}
        <ReplyList
          eventId={eventId!}
          eventStatus={eventDetail.status}
          balanceDisplayMode={balanceDisplayMode}
          search={search}
          sortBy={sortBy}
          order={order}
          options={eventDetail.options}
          eventType={eventDetail.event_type}
        />
      </div>
    </div>
  );
};

export default EventDetail;
