import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { API, type ApiResponse } from "@/api/index";
import type { GetHotHashtagsRes } from "@/api/response";
import ArrowDownIcon from "@/assets/icons/arrowDown.svg?react";
import ClearIcon from "@/assets/icons/clear.svg?react";
import SearchIcon from "@/assets/icons/search.svg?react";
import SortAscIcon from "@/assets/icons/sort-asc.svg?react";
import SortDescIcon from "@/assets/icons/sort-desc.svg?react";
import { Segmented } from "@/components/base/CustomSegmented";
import {
  type HomeSortField,
  type HomeSortOrder,
  type HomeStatusFilter,
} from "@/pages/create-event/types/index";
import { FilterButton } from "@/pages/home/component/FilterButton";
import { useHomeStore } from "@/stores/homeStore";

export function HomeToolbar() {
  const { t } = useTranslation();

  const SORT_OPTIONS: { value: HomeSortField; label: string }[] = useMemo(
    () => [
      { value: "time", label: t("homeToolbar.sortTime", "Time") },
      { value: "reward", label: t("homeToolbar.sortReward", "Reward") },
      {
        value: "participation",
        label: t("homeToolbar.sortParticipation", "Participation"),
      },
    ],
    [t],
  );
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

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // debounce search 300ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search, setDebouncedSearch]);

  const toggleSortOrder = () => {
    const next: HomeSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setIsSortActive(true);
    setSort(sortField, next);
  };

  const handleSortChange = (field: HomeSortField) => {
    setIsSortActive(true);
    setSort(field, sortOrder);
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
          <div
            className="flex-1 md:flex-none flex items-center h-9 bg-white
            dark:bg-surface rounded-lg border border-border"
          >
            {/* Order Toggle */}
            <button
              type="button"
              onClick={toggleSortOrder}
              className="flex items-center justify-center w-9 h-full border-r
              border-border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
              aria-label={
                sortOrder === "desc"
                  ? t("searchFilter.sortDesc", "Sort descending")
                  : t("searchFilter.sortAsc", "Sort ascending")
              }
            >
              {sortOrder === "desc" ? (
                <SortDescIcon className="w-4 h-4" />
              ) : (
                <SortAscIcon className="w-4 h-4" />
              )}
            </button>

            {/* Sort Field Select */}
            <div
              className="relative h-full flex-1 md:text-center"
              ref={sortDropdownRef}
            >
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="w-full md:w-[120px] h-full flex items-center justify-center gap-2 px-3
                hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors rounded-r-lg text-center cursor-pointer"
              >
                <span className="text-sm font-medium text-primary capitalize">
                  {SORT_OPTIONS.find((opt) => opt.value === sortField)?.label}
                </span>
                <ArrowDownIcon
                  className={`w-2 h-2 text-secondary transition-transform duration-200 ${
                    isSortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 min-w-full w-28 bg-white dark:bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleSortChange(opt.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-center px-4 py-2 text-sm hover:bg-black/[0.06]
                        dark:hover:bg-white/10 transition-colors ${
                          sortField === opt.value
                            ? "text-accent font-medium bg-accent/5"
                            : "text-primary"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
            {popularHashtags.map((tag) => {
              const isActive =
                activeHashtag &&
                activeHashtag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleHashtagClick(tag)}
                  className={`cursor-pointer rounded-xl px-3 py-1 text-xs md:text-sm border ${
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
