import {
  type EventSummary,
  type HomeSortField,
  type HomeSortOrder,
  type HomeStatusFilter,
} from "@/pages/create-event/types/index";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface HomeStoreState {
  // filters
  status: HomeStatusFilter;
  search: string;
  debouncedSearch: string;
  sortField: HomeSortField;
  sortOrder: HomeSortOrder;
  isSortActive: boolean;
  activeHashtag: string | null;

  // data
  events: EventSummary[];
  hasMore: boolean;
  offset: number;
  limit: number;
  total: number;
  popularHashtags: string[];

  // ui
  isLoading: boolean;
  isError: boolean;
  scrollY: number;
  isDesktop: boolean;
  collapsed: boolean;

  // actions
  setStatus: (status: HomeStatusFilter) => void;
  setSearch: (value: string) => void;
  setDebouncedSearch: (value: string) => void;
  setSort: (field: HomeSortField, order: HomeSortOrder) => void;
  setIsSortActive: (active: boolean) => void;
  setActiveHashtag: (tag: string | null) => void;
  setCollapsed: (collapsed: boolean) => void;

  setEvents: (
    events: EventSummary[],
    total: number,
    hasMore: boolean,
    offset: number,
  ) => void;
  appendEvents: (
    events: EventSummary[],
    hasMore: boolean,
    offset: number,
  ) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;

  setScrollY: (y: number) => void;
  setIsDesktop: (isDesktop: boolean) => void;
  resetFilters: () => void;
  resetList: () => void;
  setPopularHashtags: (hashtags: string[]) => void;
}

export const useHomeStore = create<HomeStoreState>()(
  devtools(
    persist(
      (set) => ({
        status: "ongoing",
        search: "",
        debouncedSearch: "",
        sortField: "time",
        sortOrder: "asc",
        isSortActive: false,
        activeHashtag: null,

        events: [],
        hasMore: true,
        offset: 0,
        limit: 20,
        total: 0,
        popularHashtags: [],

        isLoading: false,
        isError: false,
        scrollY: 0,
        isDesktop: false,
        collapsed:
          typeof window !== "undefined"
            ? localStorage.getItem("sidebarCollapsed") === "true"
            : false,

        setStatus: (status) =>
          set(
            () => ({
              status,
              // 狀態切換時重置分頁和清空事件列表
              offset: 0,
              events: [],
              hasMore: true,
              total: 0,
            }),
            false,
            "home/setStatus",
          ),
        setSearch: (value) =>
          set(() => ({ search: value }), false, "home/setSearch"),
        setDebouncedSearch: (value) =>
          set(
            () => ({
              debouncedSearch: value,
              offset: 0,
            }),
            false,
            "home/setDebouncedSearch",
          ),
        setSort: (field, order) =>
          set(
            () => ({
              sortField: field,
              sortOrder: order,
              offset: 0,
            }),
            false,
            "home/setSort",
          ),
        setIsSortActive: (active) =>
          set(() => ({ isSortActive: active }), false, "home/setIsSortActive"),
        setActiveHashtag: (tag) =>
          set(
            () => ({
              activeHashtag: tag,
              // 同步到 search input 中显示
              search: tag || "",
              debouncedSearch: tag || "",
              offset: 0,
              // 保留 sortField 和 sortOrder，但重置事件列表
              events: [],
              hasMore: true,
              total: 0,
            }),
            false,
            "home/setActiveHashtag",
          ),
        setCollapsed: (collapsed) =>
          set(
            () => {
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("sidebarCollapsed", String(collapsed));
                } catch {
                  // ignore storage errors
                }
              }
              return { collapsed };
            },
            false,
            "home/setCollapsed",
          ),

        setEvents: (events, total, hasMore, offset) =>
          set(
            () => ({
              events,
              total,
              hasMore,
              offset,
            }),
            false,
            "home/setEvents",
          ),
        appendEvents: (events, hasMore, offset) =>
          set(
            (state) => ({
              events: [...state.events, ...events],
              hasMore,
              offset,
            }),
            false,
            "home/appendEvents",
          ),

        setLoading: (isLoading) =>
          set(() => ({ isLoading }), false, "home/setLoading"),
        setError: (isError) => set(() => ({ isError }), false, "home/setError"),

        setScrollY: (y) =>
          set(() => ({ scrollY: y }), false, "home/setScrollY"),
        setIsDesktop: (isDesktop) =>
          set(() => ({ isDesktop }), false, "home/setIsDesktop"),
        resetFilters: () =>
          set(
            () => ({
              search: "",
              debouncedSearch: "",
              activeHashtag: null,
              sortField: "time",
              sortOrder: "asc", // 升序：事件快结束的排第一
              offset: 0,
            }),
            false,
            "home/resetFilters",
          ),

        resetList: () =>
          set(
            () => ({
              events: [],
              hasMore: true,
              offset: 0,
              total: 0,
            }),
            false,
            "home/resetList",
          ),

        setPopularHashtags: (hashtags) =>
          set(
            () => ({
              popularHashtags: hashtags,
            }),
            false,
            "home/setPopularHashtags",
          ),
      }),
      {
        name: "home-store",
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          status: state.status,
          search: state.search,
          debouncedSearch: state.debouncedSearch,
          sortField: state.sortField,
          sortOrder: state.sortOrder,
          isSortActive: state.isSortActive,
          activeHashtag: state.activeHashtag,
          scrollY: state.scrollY,
          // Persist data to restore scroll position
          events: state.events,
          offset: state.offset,
          hasMore: state.hasMore,
          total: state.total,
          popularHashtags: state.popularHashtags,
        }),
      },
    ),
    { name: "home-store" },
  ),
);
