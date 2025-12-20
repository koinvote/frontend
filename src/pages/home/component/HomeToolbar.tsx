import { useEffect, useState } from "react";
import { useHomeStore } from "@/stores/homeStore";
import {
  type HomeSortField,
  type HomeSortOrder,
} from "@/pages/create-event/types/index";

const SORT_OPTIONS: { value: HomeSortField; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "bounty", label: "Bounty" },
  { value: "participation", label: "Participation" },
];

export function HomeToolbar() {
  const {
    status,
    search,
    sortField,
    sortOrder,
    activeHashtag,
    setStatus,
    setSearch,
    setDebouncedSearch,
    setSort,
    setActiveHashtag,
    resetFilters,
  } = useHomeStore();

  const [popularHashtags] = useState<string[]>([]);

  // debounce search 300ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(id);
  }, [search, setDebouncedSearch]);

  const isOngoing = status === "ongoing";

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
    // 根據狀態給預設順序
    const defaultOrder: HomeSortOrder =
      field === "time" ? (isOngoing ? "asc" : "desc") : "desc";
    setSort(field, defaultOrder);
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
      {/* status tabs + sort (desktop 可以橫排，mobile 堆疊) */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex rounded-full bg-surface border border-border p-1 w-fit">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-sm md:text-base ${
              isOngoing ? "bg-accent text-accent-foreground" : "text-secondary"
            }`}
            onClick={() => setStatus("ongoing")}
          >
            Ongoing
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-sm md:text-base ${
              !isOngoing ? "bg-accent text-accent-foreground" : "text-secondary"
            }`}
            onClick={() => setStatus("completed")}
          >
            Completed
          </button>
        </div>

        {/* sort */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={toggleSortOrder}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-xs"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          <select
            className="h-9 rounded-full border border-border bg-surface px-3 text-sm md:text-base"
            value={sortField}
            onChange={(e) => handleSortChange(e.target.value as HomeSortField)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, body, hashtag, Event ID, or BTC address..."
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm md:text-base outline-none"
        />
      </div>

      {/* popular hashtags */}
      {popularHashtags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs md:text-sm text-secondary">
            Popular hashtags
          </span>
          {popularHashtags.map((tag) => {
            const isActive =
              activeHashtag &&
              activeHashtag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleHashtagClick(tag)}
                className={`rounded-full px-3 py-1 text-xs md:text-sm border ${
                  isActive
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-surface border-border text-secondary"
                }`}
              >
                {tag}
              </button>
            );
          })}

          {/* 清除搜尋條件 */}
          {(search || activeHashtag) && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs md:text-sm text-accent underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
