import { useEffect } from "react";

import { API, type ApiResponse } from "@/api/index";
import type { GetEventCountsRes } from "@/api/response";
import type { HomeStatusFilter } from "@/pages/create-event/types/index";
import { useHomeStore } from "@/stores/homeStore";

// 依 counts 決定預設頁籤：
// ongoing > 0 → ongoing；否則 preheat > 0 → preheat；否則 completed
const resolveDefaultTab = (counts: GetEventCountsRes): HomeStatusFilter => {
  if (counts.ongoing > 0) return "ongoing";
  if (counts.preheat > 0) return "preheat";
  return "completed";
};

/**
 * 取得各頁籤（preheat / ongoing / completed）的事件數量，
 * 並於每次進入首頁時，依規格重新判斷預設頁籤。
 */
export function useHomeEventCounts() {
  const eventCounts = useHomeStore((s) => s.eventCounts);
  const setEventCounts = useHomeStore((s) => s.setEventCounts);
  const setStatus = useHomeStore((s) => s.setStatus);
  const setSort = useHomeStore((s) => s.setSort);

  useEffect(() => {
    let cancelled = false;

    // 套用預設頁籤；setStatus 會清空列表並觸發重新載入，僅在頁籤真的需要改變時呼叫。
    const applyDefaultTab = (tab: HomeStatusFilter) => {
      const state = useHomeStore.getState();
      if (state.status === tab) return;
      setStatus(tab);
      // 與 HomeToolbar.handleTabChange 一致：使用者未手動改過排序時，套用該頁籤的預設排序
      // completed → time desc；preheat / ongoing → time asc
      if (!state.isSortActive) {
        setSort("time", tab === "completed" ? "desc" : "asc");
      }
    };

    const fetchCounts = async () => {
      try {
        const res = (await API.getEventCounts()) as unknown as ApiResponse<GetEventCountsRes>;
        if (cancelled) return;

        if (res.success && res.data) {
          setEventCounts(res.data);
          applyDefaultTab(resolveDefaultTab(res.data));
        } else {
          // 回應異常，比照打不到 API 處理：預設顯示 Ongoing
          applyDefaultTab("ongoing");
        }
      } catch (e) {
        console.error("Failed to fetch event counts", e);
        if (cancelled) return;
        // API 打不到時，預設顯示 Ongoing
        applyDefaultTab("ongoing");
      }
    };

    fetchCounts();
    return () => {
      cancelled = true;
    };
    // 僅在掛載時執行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { eventCounts };
}
