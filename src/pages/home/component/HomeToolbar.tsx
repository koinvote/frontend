import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { API, type ApiResponse } from "@/api/index";
import type { GetHotHashtagsRes } from "@/api/response";
import ClearIcon from "@/assets/icons/clear.svg?react";
import SearchIcon from "@/assets/icons/search.svg?react";
import { Segmented } from "@/components/base/CustomSegmented";
import { SortControl, type SortOption } from "@/components/base/SortControl";
import {
  type HomeSortField,
  type HomeSortOrder,
  type HomeStatusFilter,
} from "@/pages/create-event/types/index";
import { FilterButton } from "@/pages/home/component/FilterButton";
import { useHomeStore } from "@/stores/homeStore";

export function HomeToolbar() {
  const { t } = useTranslation();
  const {
    isDesktop,
    status,
    search,
    sortField,
    sortOrder,
    isSortActive,
    activeHashtag,
    popularHashtags,
    isLoading,
    setStatus,
    setSearch,
    setDebouncedSearch,
    setSort,
    setIsSortActive,
    setActiveHashtag,
    // resetFilters,
  } = useHomeStore();

  // "time" sorts by the event deadline, so its direction wording depends on
  // whether the events are still running or already over.
  const SORT_OPTIONS: SortOption<HomeSortField>[] = useMemo(() => {
    const amountOrderLabels = {
      desc: t("searchFilter.orderHighFirst", "High to low"),
      asc: t("searchFilter.orderLowFirst", "Low to high"),
    };
    const timeOrderLabels =
      status === "completed"
        ? {
            desc: t("searchFilter.orderRecentlyEnded", "Recently ended"),
            asc: t("searchFilter.orderEarliestEnded", "Earliest ended"),
          }
        : {
            desc: t("searchFilter.orderEndingLatest", "Ending latest"),
            asc: t("searchFilter.orderEndingSoonest", "Ending soonest"),
          };
    return [
      {
        value: "time",
        label: t("homeToolbar.sortTime", "Time"),
        orderLabels: timeOrderLabels,
        defaultOrder: status === "completed" ? "desc" : "asc",
      },
      {
        value: "reward",
        label: t("homeToolbar.sortReward", "Reward"),
        orderLabels: amountOrderLabels,
        defaultOrder: "desc",
      },
      {
        value: "participation",
        label: t("homeToolbar.sortParticipation", "Participation"),
        orderLabels: amountOrderLabels,
        defaultOrder: "desc",
      },
    ];
  }, [t, status]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // debounce search 300ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search, setDebouncedSearch]);

  const handleSortChange = (field: HomeSortField, order: HomeSortOrder) => {
    setIsSortActive(true);
    setSort(field, order);
  };

  // 获取热门标签
  useEffect(() => {
    const fetchHotHashtags = async () => {
      try {
        const res = (await API.getHotHashtags({
          tab: status,
          limit: 10,
        })) as unknown as ApiResponse<GetHotHashtagsRes>;
        if (res.success && res.data) {
          // 确保标签有 # 前缀
          const hashtags = res.data.map((tag) =>
            tag.startsWith("#") ? tag : `#${tag}`,
          );
          useHomeStore.getState().setPopularHashtags(hashtags);
        }
      } catch (error) {
        console.error("Failed to fetch hot hashtags", error);
      }
    };
    fetchHotHashtags();
  }, [status]);

  const handleTabChange = (value: HomeStatusFilter) => {
    setStatus(value);
    // 預設排序
    if (!isSortActive) {
      if (value === "completed") {
        setSort("time", "desc");
      } else {
        setSort("time", "asc");
      }
    }
  };

  const handleHashtagClick = (tag: string) => {
    if (activeHashtag && activeHashtag.toLowerCase() === tag.toLowerCase()) {
      setActiveHashtag(null);
    } else {
      setActiveHashtag(tag);
    }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <Segmented<HomeStatusFilter>
          block={!isDesktop}
          size="large"
          loading={isLoading}
          value={status}
          options={[
            { label: t("homeToolbar.preheat", "Preheat"), value: "preheat" },
            { label: t("homeToolbar.ongoing", "Ongoing"), value: "ongoing" },
            {
              label: t("homeToolbar.completed", "Completed"),
              value: "completed",
            },
          ]}
          onChange={handleTabChange}
        />

        {/* search */}
        <div className="relative flex flex-1 items-center min-w-0">
          <div className="absolute left-4 pointer-events-none">
            <SearchIcon className="w-4 h-4 text-secondary" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (activeHashtag && e.target.value !== activeHashtag) {
                setActiveHashtag(null);
              }
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t(
              "homeToolbar.searchPlaceholder",
              "Search by title, address, Event ID",
            )}
            className="flex-1 rounded-xl border border-border bg-surface pl-11 
          pr-10 py-2 text-base md:text-base outline-none w-full min-w-0 
          focus:ring-0.5 focus:ring-(--color-orange-500) 
          focus:border-(--color-orange-500)"
          />
          {(isSearchFocused || search) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setActiveHashtag(null);
                setIsSearchFocused(false);
              }}
              className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full hover:bg-surface-hover text-secondary hover:text-primary transition-colors"
              aria-label="Clear search"
            >
              <ClearIcon className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>

        {/* sort + filter */}
        <div className="flex items-center gap-2 w-full md:w-auto self-start md:self-auto">
          <SortControl
            className="flex-1 md:flex-none md:w-[156px]"
            options={SORT_OPTIONS}
            field={sortField}
            order={sortOrder}
            onChange={handleSortChange}
          />
          <FilterButton />
        </div>
      </div>

      {/* popular hashtags */}
      {popularHashtags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-secondary">
              {t("homeToolbar.popularHashtags", "Popular hashtags")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {popularHashtags.map((tag, index) => {
              const isActive =
                activeHashtag &&
                activeHashtag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleHashtagClick(tag)}
                  // On mobile only the first 8 tags fit without spilling into
                  // an extra row; the rest stay desktop-only.
                  className={`${index >= 8 ? "hidden md:inline-block" : ""} cursor-pointer rounded-xl px-3 py-1 text-xs md:text-sm border ${
                    isActive
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-surface border-border text-secondary"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
