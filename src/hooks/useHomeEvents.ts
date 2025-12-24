import { useEffect, useCallback, useMemo, useRef } from "react";
import { useHomeStore } from "@/stores/homeStore";
import { API, type ApiResponse } from "@/api/index";
import { mapApiEventToEventSummary } from "@/utils/eventTransform";
import type { GetEventListRes } from "@/api/response";

// Map frontend status filter to backend tab parameter
const mapStatusToTab = (
  status: "preheat" | "ongoing" | "completed"
): "preheat" | "ongoing" | "completed" => {
  return status;
};

// Map frontend sortField to backend sortBy
const mapSortFieldToSortBy = (
  sortField: "time" | "reward" | "participation"
): "time" | "reward" | "participation" => {
  if (sortField === "reward") return "reward";
  return sortField;
};

// Calculate popular hashtags from events
function calculatePopularHashtags(
  events: Array<{ hashtags: string[] }>
): string[] {
  const hashtagCount = new Map<string, number>();

  // Count hashtag occurrences (remove # prefix for counting)
  events.forEach((event) => {
    event.hashtags.forEach((tag) => {
      const normalizedTag = tag.startsWith("#")
        ? tag.slice(1).toLowerCase()
        : tag.toLowerCase();
      hashtagCount.set(
        normalizedTag,
        (hashtagCount.get(normalizedTag) || 0) + 1
      );
    });
  });

  // Sort by count (descending) and take top 8
  const sortedHashtags = Array.from(hashtagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => `#${tag}`);

  return sortedHashtags;
}

export function useHomeEvents() {
  const {
    status,
    debouncedSearch,
    sortField,
    sortOrder,
    events,
    hasMore,
    offset,
    limit,
    isLoading,
    isError,
    setEvents,
    appendEvents,
    setLoading,
    setError,
    setPopularHashtags,
  } = useHomeStore();

  // Track the status when request was made to prevent race conditions
  const requestStatusRef = useRef(status);

  // Calculate popular hashtags from current events
  const popularHashtags = useMemo(
    () => calculatePopularHashtags(events),
    [events]
  );

  // Update popular hashtags in store when events change
  useEffect(() => {
    setPopularHashtags(popularHashtags);
  }, [popularHashtags, setPopularHashtags]);

  // Update requestStatusRef when status changes
  useEffect(() => {
    requestStatusRef.current = status;
  }, [status]);

  const loadFirstPage = useCallback(async () => {
    // Capture the status at the time of request
    const requestStatus = status;
    requestStatusRef.current = requestStatus;

    setLoading(true);
    setError(false);
    try {
      const currentPage = 1;
      const res = (await API.getEventList({
        tab: mapStatusToTab(requestStatus),
        q: debouncedSearch || "",
        page: String(currentPage),
        limit: String(limit),
        sortBy: mapSortFieldToSortBy(sortField),
        order: sortOrder,
      })) as unknown as ApiResponse<GetEventListRes>;

      // Only update events if status hasn't changed since the request was made
      if (requestStatusRef.current !== requestStatus) {
        return; // Status changed, ignore this response
      }

      if (res.success && res.data) {
        const transformedEvents = res.data.events.map(
          mapApiEventToEventSummary
        );
        const total = res.data.events.length; // Backend doesn't return total, use current page length
        const hasMoreData = res.data.events.length === limit;
        const newOffset = transformedEvents.length;

        setEvents(transformedEvents, total, hasMoreData, newOffset);
      } else {
        setError(true);
      }
    } catch (e) {
      // Only set error if status hasn't changed
      if (requestStatusRef.current === requestStatus) {
        console.error("Failed to load events", e);
        setError(true);
      }
    } finally {
      // Only update loading state if status hasn't changed
      if (requestStatusRef.current === requestStatus) {
        setLoading(false);
      }
    }
  }, [
    status,
    debouncedSearch,
    sortField,
    sortOrder,
    limit,
    setEvents,
    setLoading,
    setError,
  ]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    // Capture the status at the time of request
    const requestStatus = status;

    setLoading(true);
    setError(false);
    try {
      // Calculate page number from offset
      const currentPage = Math.floor(offset / limit) + 1;
      const res = (await API.getEventList({
        tab: mapStatusToTab(requestStatus),
        q: debouncedSearch || "",
        page: String(currentPage),
        limit: String(limit),
        sortBy: mapSortFieldToSortBy(sortField),
        order: sortOrder,
      })) as unknown as ApiResponse<GetEventListRes>;

      // Only update events if status hasn't changed since the request was made
      if (requestStatusRef.current !== requestStatus) {
        return; // Status changed, ignore this response
      }

      if (res.success && res.data) {
        const transformedEvents = res.data.events.map(
          mapApiEventToEventSummary
        );
        const hasMoreData = res.data.events.length === limit;
        const newOffset = offset + transformedEvents.length;

        appendEvents(transformedEvents, hasMoreData, newOffset);
      } else {
        setError(true);
      }
    } catch (e) {
      // Only set error if status hasn't changed
      if (requestStatusRef.current === requestStatus) {
        console.error("Failed to load more events", e);
        setError(true);
      }
    } finally {
      // Only update loading state if status hasn't changed
      if (requestStatusRef.current === requestStatus) {
        setLoading(false);
      }
    }
  }, [
    status,
    debouncedSearch,
    sortField,
    sortOrder,
    offset,
    limit,
    isLoading,
    hasMore,
    appendEvents,
    setLoading,
    setError,
  ]);

  // filters 改變時重新載入第一頁
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  return {
    events,
    isLoading,
    isError,
    hasMore,
    loadMore,
    reload: loadFirstPage,
  };
}
