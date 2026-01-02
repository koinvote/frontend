import { useEffect, useCallback, useRef } from "react";
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

// 移除 calculatePopularHashtags，改为从 API 获取

export function useHomeEvents() {
  const {
    status,
    debouncedSearch,
    activeHashtag,
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
  } = useHomeStore();

  // Track the status when request was made to prevent race conditions
  const requestStatusRef = useRef(status);

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
      // 区分 hashtag 搜索和普通搜索
      // 如果 activeHashtag 存在，使用 tag 参数；否则使用 q 参数
      const hashtagForTag = activeHashtag
        ? activeHashtag.startsWith("#")
          ? activeHashtag.slice(1)
          : activeHashtag
        : undefined;

      // q 参数用于用户手动输入的搜索（title/description/Event ID）
      // 如果 activeHashtag 存在，q 应该为空（因为使用 tag 参数）
      const q = activeHashtag ? "" : debouncedSearch || "";

      const res = (await API.getEventList({
        tab: mapStatusToTab(requestStatus),
        q,
        tag: hashtagForTag,
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
    activeHashtag,
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
      // 区分 hashtag 搜索和普通搜索
      // 如果 activeHashtag 存在，使用 tag 参数；否则使用 q 参数
      const hashtagForTag = activeHashtag
        ? activeHashtag.startsWith("#")
          ? activeHashtag.slice(1)
          : activeHashtag
        : undefined;

      // q 参数用于用户手动输入的搜索（title/description/Event ID）
      // 如果 activeHashtag 存在，q 应该为空（因为使用 tag 参数）
      const q = activeHashtag ? "" : debouncedSearch || "";

      const res = (await API.getEventList({
        tab: mapStatusToTab(requestStatus),
        q,
        tag: hashtagForTag,
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
    activeHashtag,
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
