import { useState, useEffect } from "react";
import SearchIcon from "@/assets/icons/search.svg?react";
import ClearIcon from "@/assets/icons/clear.svg?react";
import { ReplySortBy } from "@/api/types";

interface SearchAndFilterProps {
  eventId: string;
  onSearchChange?: (search: string) => void;
  onSortChange?: (
    sortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME,
    order: "desc" | "asc"
  ) => void;
}

export function SearchAndFilter({
  eventId,
  onSearchChange,
  onSortChange,
}: SearchAndFilterProps) {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME>(
    ReplySortBy.BALANCE
  );
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, onSearchChange]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSortChange = (
    newSortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME
  ) => {
    const newOrder = newSortBy === sortBy && order === "desc" ? "asc" : "desc";
    setSortBy(newSortBy);
    setOrder(newOrder);
    onSortChange?.(newSortBy, newOrder);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      {/* Search */}
      <div className="relative flex flex-1 items-center min-w-0">
        <div className="absolute left-4 pointer-events-none">
          <SearchIcon className="w-4 h-4 text-secondary" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search BTC address or reply content..."
          className="flex-1 rounded-xl border border-border bg-surface pl-11 pr-10 py-2 text-base md:text-base outline-none w-full min-w-0"
        />
        {(isSearchFocused || search) && (
          <button
            type="button"
            onClick={() => {
              handleSearchChange("");
              setIsSearchFocused(false);
            }}
            className="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full hover:bg-surface-hover text-secondary hover:text-primary transition-colors"
            aria-label="Clear search"
          >
            <ClearIcon className="w-4 h-4 text-secondary" />
          </button>
        )}
      </div>

      {/* Filter and Sort */}
      <div className="flex items-center gap-2">
        {/* Sort by Balance */}
        <button
          type="button"
          onClick={() => handleSortChange(ReplySortBy.BALANCE)}
          className={`flex items-center justify-center h-9 px-3 rounded-xl border border-border bg-surface text-xs md:text-sm transition-all duration-300 ease-in-out ${
            sortBy === ReplySortBy.BALANCE
              ? "bg-white text-black border-border"
              : "text-secondary"
          }`}
        >
          Balance
          {sortBy === ReplySortBy.BALANCE && (
            <span className="ml-1">{order === "desc" ? "↓" : "↑"}</span>
          )}
        </button>

        {/* Sort by Time */}
        <button
          type="button"
          onClick={() => handleSortChange(ReplySortBy.TIME)}
          className={`flex items-center justify-center h-9 px-3 rounded-xl border border-border bg-surface text-xs md:text-sm transition-all duration-300 ease-in-out ${
            sortBy === ReplySortBy.TIME
              ? "bg-white text-black border-border"
              : "text-secondary"
          }`}
        >
          Time
          {sortBy === ReplySortBy.TIME && (
            <span className="ml-1">{order === "desc" ? "↓" : "↑"}</span>
          )}
        </button>
      </div>
    </div>
  );
}

