import { create } from "zustand";
import {
  type EventSummary,
  type HomeSortField,
  type HomeSortOrder,
  type HomeStatusFilter,
} from "@/pages/create-event/types/index";

interface HomeStoreState {
  // filters
  status: HomeStatusFilter;
  search: string;
  debouncedSearch: string;
  sortField: HomeSortField;
  sortOrder: HomeSortOrder;
  activeHashtag: string | null;

  // data
  events: EventSummary[];
  hasMore: boolean;
  offset: number;
  limit: number;
  total: number;

  // ui
  isLoading: boolean;
  isError: boolean;
  scrollY: number;

  // actions
  setStatus: (status: HomeStatusFilter) => void;
  setSearch: (value: string) => void;
  setDebouncedSearch: (value: string) => void;
  setSort: (field: HomeSortField, order: HomeSortOrder) => void;
  setActiveHashtag: (tag: string | null) => void;

  setEvents: (
    events: EventSummary[],
    total: number,
    hasMore: boolean,
    offset: number
  ) => void;
  appendEvents: (
    events: EventSummary[],
    hasMore: boolean,
    offset: number
  ) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;

  setScrollY: (y: number) => void;
  resetFilters: () => void;
  resetList: () => void;
}

export const useHomeStore = create<HomeStoreState>((set) => ({
  status: "ongoing",
  search: "",
  debouncedSearch: "",
  sortField: "time",
  sortOrder: "asc",
  activeHashtag: null,

  events: [],
  hasMore: true,
  offset: 0,
  limit: 20,
  total: 0,

  isLoading: false,
  isError: false,
  scrollY: 0,

  setStatus: (status) =>
    set(() => ({
      status,
      // 狀態切換時重置分頁
      offset: 0,
    })),
  setSearch: (value) => set(() => ({ search: value })),
  setDebouncedSearch: (value) =>
    set(() => ({
      debouncedSearch: value,
      offset: 0,
    })),
  setSort: (field, order) =>
    set(() => ({
      sortField: field,
      sortOrder: order,
      offset: 0,
    })),
  setActiveHashtag: (tag) =>
    set(() => ({
      activeHashtag: tag,
      offset: 0,
    })),

  setEvents: (events, total, hasMore, offset) =>
    set(() => ({
      events,
      total,
      hasMore,
      offset,
    })),
  appendEvents: (events, hasMore, offset) =>
    set((state) => ({
      events: [...state.events, ...events],
      hasMore,
      offset,
    })),

  setLoading: (isLoading) => set(() => ({ isLoading })),
  setError: (isError) => set(() => ({ isError })),

  setScrollY: (y) => set(() => ({ scrollY: y })),

  resetFilters: () =>
    set((state) => ({
      search: "",
      debouncedSearch: "",
      activeHashtag: null,
      sortField: "time",
      sortOrder: state.status === "ongoing" ? "asc" : "desc",
      offset: 0,
    })),

  resetList: () =>
    set(() => ({
      events: [],
      hasMore: true,
      offset: 0,
      total: 0,
    })),
}));
