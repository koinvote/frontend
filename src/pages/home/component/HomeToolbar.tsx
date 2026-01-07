import { useEffect, useState } from "react";
import { useHomeStore } from "@/stores/homeStore";
import {
  type HomeSortField,
  type HomeSortOrder,
} from "@/pages/create-event/types/index";
import { API, type ApiResponse } from "@/api/index";
import type { GetHotHashtagsRes } from "@/api/response";
import SearchIcon from "@/assets/icons/search.svg?react";
import ClearIcon from "@/assets/icons/clear.svg?react";

const SORT_OPTIONS: { value: HomeSortField; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "reward", label: "Reward" },
  { value: "participation", label: "Participation" },
];

export function HomeToolbar() {
  const {
    status,
    search,
    sortField,
    sortOrder,
    activeHashtag,
    popularHashtags,
    setStatus,
    setSearch,
    setDebouncedSearch,
    setSort,
    setActiveHashtag,
    // resetFilters,
  } = useHomeStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // debounce search 300ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search, setDebouncedSearch]);

  const isPreheat = status === "preheat";
  const isOngoing = status === "ongoing";
  const isCompleted = status === "completed";

  // const sortLabel = useMemo(
  //   () =>
  //     SORT_OPTIONS.find((opt) => opt.value === sortField)?.label ?? 'Time',
  //   [sortField],
  // )

  const toggleSortOrder = () => {
    const next: HomeSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSort(sortField, next);
  };

  const handleSortChange = (field: HomeSortField) => {
    const defaultOrder: HomeSortOrder = field === "time" ? "asc" : "desc";
    setSort(field, defaultOrder);
  };

  // 获取热门标签
  useEffect(() => {
    const fetchHotHashtags = async () => {
      try {
        const res = (await API.getHotHashtags({
          limit: 10,
        })) as unknown as ApiResponse<GetHotHashtagsRes>;
        if (res.success && res.data) {
          // 确保标签有 # 前缀
          const hashtags = res.data.map((tag) =>
            tag.startsWith("#") ? tag : `#${tag}`
          );
          useHomeStore.getState().setPopularHashtags(hashtags);
        }
      } catch (error) {
        console.error("Failed to fetch hot hashtags", error);
      }
    };
    fetchHotHashtags();
  }, []);

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
        <div className="flex rounded-xl bg-surface border border-border p-1 w-full md:w-fit">
          <button
            type="button"
            className={`cursor-pointer flex-1 px-4 py-1.5 rounded-xl text-sm md:text-base text-center transition-all duration-300 ease-in-out ${
              isPreheat ? "bg-white text-black" : "text-secondary"
            }`}
            onClick={() => setStatus("preheat")}
          >
            Preheat
          </button>
          <button
            type="button"
            className={`cursor-pointer flex-1 px-4 py-1.5 rounded-xl text-sm md:text-base text-center transition-all duration-300 ease-in-out ${
              isOngoing ? "bg-white text-black" : "text-secondary"
            }`}
            onClick={() => setStatus("ongoing")}
          >
            Ongoing
          </button>
          <button
            type="button"
            className={`cursor-pointer flex-1 px-4 py-1.5 rounded-xl text-sm md:text-base text-center transition-all duration-300 ease-in-out ${
              isCompleted ? "bg-white text-black" : "text-secondary"
            }`}
            onClick={() => setStatus("completed")}
          >
            Completed
          </button>
        </div>

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
            placeholder="Search by title, address, Event ID"
            className="flex-1 rounded-xl border border-border bg-surface pl-11 pr-10 py-2 text-base md:text-base outline-none w-full min-w-0"
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

        {/* sort */}
        <div className="flex items-center gap-2 w-full md:w-auto self-start md:self-auto">
          <button
            type="button"
            onClick={toggleSortOrder}
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-xs flex-shrink-0"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          <div className="relative flex-1 md:flex-none">
            <select
              className="cursor-pointer w-full h-9 rounded-xl 
              border border-border bg-surface px-3 pr-8 text-sm 
              md:text-base text-center appearance-none 
              outline-none transition-all"
              style={{
                textAlign: "center",
                textAlignLast: "center",
              }}
              value={sortField}
              onChange={(e) =>
                handleSortChange(e.target.value as HomeSortField)
              }
            >
              {SORT_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="text-center"
                  style={{ textAlign: "center" }}
                >
                  {opt.label}
                </option>
              ))}
            </select>
            {/* 自定义下拉箭头 */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-secondary"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* popular hashtags */}
      {popularHashtags.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-secondary">
              Popular hashtags
            </span>
            {/* {(search || activeHashtag) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs md:text-sm text-accent underline"
              >
                Clear filters
              </button>
            )} */}
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
