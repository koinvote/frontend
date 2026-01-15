import { useState, useEffect, useRef } from "react";
import SearchIcon from "@/assets/icons/search.svg?react";
import ClearIcon from "@/assets/icons/clear.svg?react";
import SortAscIcon from "@/assets/icons/sort-asc.svg?react";
import SortDescIcon from "@/assets/icons/sort-desc.svg?react";
import PlusIcon from "@/assets/icons/plus.svg?react";
import ArrowDownIcon from "@/assets/icons/arrowDown.svg?react";
import OnChainIcon from "@/assets/icons/onChain.svg?react";
import { ReplySortBy, EventStatus } from "@/api/types";
import { useDebouncedClick } from "@/utils/helper";
import { Button } from "@/components/base/Button";

interface SearchAndFilterProps {
  eventId: string;
  eventStatus?: number;
  balanceDisplayMode?: "snapshot" | "on_chain";
  onBalanceDisplayModeChange?: (mode: "snapshot" | "on_chain") => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (
    sortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME,
    order: "desc" | "asc"
  ) => void;
}

export function SearchAndFilter({
  eventStatus,
  balanceDisplayMode,
  onBalanceDisplayModeChange,
  onSearchChange,
  onSortChange,
}: SearchAndFilterProps) {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<
    typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME
  >(ReplySortBy.BALANCE);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [isIconSpinning, setIsIconSpinning] = useState(false);

  // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const toggleOrder = () => {
    const newOrder = order === "desc" ? "asc" : "desc";
    setOrder(newOrder);
    onSortChange?.(sortBy, newOrder);
  };

  const handleSortFieldChange = (
    newSortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME
  ) => {
    setSortBy(newSortBy);
    setIsSortDropdownOpen(false);
    onSortChange?.(newSortBy, order);
  };

  const handleRewardClick = useDebouncedClick(() => {
    // Logic not implemented yet
    console.log("Reward clicked");
  });

  const isActive = eventStatus === EventStatus.ACTIVE;
  const isCompleted = eventStatus === EventStatus.COMPLETED;
  const isPreheat = eventStatus === EventStatus.PREHEAT;

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
          placeholder="Search by address, content or option"
          className="flex-1 rounded-xl border border-border bg-surface pl-11 pr-10 py-2 text-sm outline-none w-full min-w-0 focus:border-accent transition-colors"
        />
        {(isSearchFocused || search) && (
          <button
            type="button"
            onClick={() => {
              handleSearchChange("");
              setIsSearchFocused(false);
            }}
            className="absolute right-3 flex items-center justify-center w-5 h-5 
            rounded-full hover:bg-surface-hover text-secondary 
            hover:text-primary transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <ClearIcon className="w-4 h-4 text-secondary" />
          </button>
        )}
      </div>

      {/* Filter and Sort */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* Sort Control */}
        <div
          className="flex-1 md:flex-none flex items-center h-9 bg-white 
          dark:bg-surface rounded-lg border 
          border-border"
        >
          {/* Order Toggle */}
          <button
            type="button"
            onClick={toggleOrder}
            className="flex items-center justify-center w-9 h-full border-r 
            border-border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
            aria-label={order === "desc" ? "Sort descending" : "Sort ascending"}
          >
            {order === "desc" ? (
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
              className="w-full md:w-[90px] h-full flex items-center justify-center gap-2 px-3 
              hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-r-lg text-center"
            >
              <span className="text-sm font-medium text-primary capitalize">
                {sortBy}
              </span>
              <ArrowDownIcon
                className={`w-2 h-2 text-secondary transition-transform duration-200 ${
                  isSortDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isSortDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 min-w-full w-28 bg-white dark:bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSortFieldChange(ReplySortBy.BALANCE)}
                  className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-50 
                    dark:hover:bg-gray-900 transition-colors ${
                      sortBy === ReplySortBy.BALANCE
                        ? "text-accent font-medium bg-accent/5"
                        : "text-primary"
                    }`}
                >
                  Balance
                </button>
                <button
                  type="button"
                  onClick={() => handleSortFieldChange(ReplySortBy.TIME)}
                  className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-50 
                    dark:hover:bg-gray-900 transition-colors ${
                      sortBy === ReplySortBy.TIME
                        ? "text-accent font-medium bg-accent/5"
                        : "text-primary"
                    }`}
                >
                  Time
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reward Button (Active Only) OR On-chain Button (Completed Only) */}
        <div className={isActive || isCompleted ? "flex-1 md:flex-none" : ""}>
          {(isActive || isPreheat) && (
            <Button
              appearance="solid"
              tone="surface"
              text="sm"
              className="h-9 gap-1 w-full md:w-auto dark:hover:bg-gray-900"
              onClick={handleRewardClick}
            >
              <PlusIcon className="w-3 h-3" />
              Reward
            </Button>
          )}
          {isCompleted && (
            <Button
              appearance="solid"
              tone="surface"
              text="sm"
              className="h-9 gap-1 w-full md:w-[120px] dark:hover:bg-gray-900"
              onClick={() => {
                setIsIconSpinning(true);
                setTimeout(() => setIsIconSpinning(false), 600);
                onBalanceDisplayModeChange?.(
                  balanceDisplayMode === "snapshot" ? "on_chain" : "snapshot"
                );
              }}
            >
              {balanceDisplayMode === "snapshot" ? (
                <>
                  <OnChainIcon
                    className={`w-3 h-3 ${
                      isIconSpinning ? "animate-spin" : ""
                    }`}
                  />
                  On-chain
                </>
              ) : (
                <>
                  <OnChainIcon
                    className={`w-3 h-3 ${
                      isIconSpinning ? "animate-spin" : ""
                    }`}
                  />
                  Snapshot
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
