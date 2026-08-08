import { useTranslation } from "react-i18next";

import { EventStatus, ReplySortBy } from "@/api/types";
import ClearIcon from "@/assets/icons/clear.svg?react";
import OnChainIcon from "@/assets/icons/onChain.svg?react";
import SearchIcon from "@/assets/icons/search.svg?react";
import { Button } from "@/components/base/Button";
import { SortControl, type SortOrder } from "@/components/base/SortControl";
import { useDebouncedClick } from "@/utils/helper";
import { useEffect, useState } from "react";
import styles from "./SearchAndFilter.module.css";

interface SearchAndFilterProps {
  eventId: string;
  eventStatus?: number;
  balanceDisplayMode?: "snapshot" | "on_chain";
  onBalanceDisplayModeChange?: (mode: "snapshot" | "on_chain") => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (
    sortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME,
    order: "desc" | "asc",
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
  >(ReplySortBy.TIME);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [spinDeg, setSpinDeg] = useState(0);
  const { t } = useTranslation();

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
    newSortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME,
    newOrder: SortOrder,
  ) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
    onSortChange?.(newSortBy, newOrder);
  };

  const handleRewardClick = useDebouncedClick(() => {
    // Logic not implemented yet
    // console.log("Reward clicked");
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
          placeholder={t(
            "replyList.searchPlaceholder",
            "Search by address or content",
          )}
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
        <SortControl
          className="flex-1 md:flex-none md:w-[128px]"
          options={[
            {
              value: ReplySortBy.BALANCE,
              label: t("searchFilter.balance", "Balance"),
              orderLabels: {
                desc: t("searchFilter.orderHighFirst", "High to low"),
                asc: t("searchFilter.orderLowFirst", "Low to high"),
              },
              defaultOrder: "desc",
            },
            {
              value: ReplySortBy.TIME,
              label: t("searchFilter.time", "Time"),
              orderLabels: {
                desc: t("searchFilter.orderNewestFirst", "Newest first"),
                asc: t("searchFilter.orderOldestFirst", "Oldest first"),
              },
              defaultOrder: "desc",
            },
          ]}
          field={sortBy}
          order={order}
          onChange={handleSortChange}
        />

        {/* Reward Button (Active Only) OR On-chain Button (Completed Only) */}

        {/* {(isActive || isPreheat) && (
            <Button
              appearance="solid"
              tone="surface"
              text="sm"
              className="h-9 gap-1 w-full md:w-auto dark:hover:bg-gray-900"
              onClick={handleRewardClick}
            >
              <PlusIcon className="w-3 h-3" />
              {t("searchFilter.reward", "Reward")}
            </Button>
          )} */}
        {isCompleted && (
          <div className="flex-1 md:flex-none">
            <Button
              appearance="solid"
              tone="surface"
              text="sm"
              className="h-9 gap-1 w-full md:w-[120px] dark:hover:bg-gray-900"
              onClick={() => {
                setSpinDeg((d) => d + 180);
                onBalanceDisplayModeChange?.(
                  balanceDisplayMode === "snapshot" ? "on_chain" : "snapshot",
                );
              }}
            >
              {balanceDisplayMode === "snapshot" ? (
                <>
                  <OnChainIcon
                    className={`w-3 h-3 ${styles["on-chain-icon"]}`}
                    style={{ transform: `rotate(${spinDeg}deg)` }}
                  />
                  <span className="w-16">
                    {t("searchFilter.onChain", "On-chain")}
                  </span>
                </>
              ) : (
                <>
                  <OnChainIcon
                    className={`w-3 h-3 ${styles["on-chain-icon"]}`}
                    style={{ transform: `rotate(${spinDeg}deg)` }}
                  />
                  <span className="w-16">
                    {t("searchFilter.snapshot", "Snapshot")}
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
