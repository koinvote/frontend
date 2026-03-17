import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import FilterIcon from "@/assets/icons/filter.svg?react";
import { useHomeStore } from "@/stores/homeStore";

type FilterDraft = {
  rewardType: string[];
  eventType: string[];
  visibility: string[];
};

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2"
      onClick={() => onChange(!checked)}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? "border-accent bg-accent" : "border-border bg-surface"
        }`}
      >
        {checked && (
          <svg
            width="12"
            height="9"
            viewBox="0 0 12 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-primary text-sm">{label}</span>
    </label>
  );
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterButton() {
  const { t } = useTranslation();
  const { filterRewardType, filterEventType, filterVisibility, setFilters } =
    useHomeStore();

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>({
    rewardType: [],
    eventType: [],
    visibility: [],
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync draft from store when opening
  useEffect(() => {
    if (isOpen) {
      setDraft({
        rewardType: [...filterRewardType],
        eventType: [...filterEventType],
        visibility: [...filterVisibility],
      });
    }
  }, [isOpen, filterRewardType, filterEventType, filterVisibility]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const activeCount =
    filterRewardType.length + filterEventType.length + filterVisibility.length;

  const draftCount =
    draft.rewardType.length + draft.eventType.length + draft.visibility.length;

  const handleApply = () => {
    setFilters(draft.rewardType, draft.eventType, draft.visibility);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setDraft({ rewardType: [], eventType: [], visibility: [] });
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
          isOpen || activeCount > 0
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface text-primary"
        }`}
      >
        {/* Filter icon */}
        {activeCount === 0 && (
          <FilterIcon
            className={`shrink-0 ${isOpen ? "text-primary" : "text-secondary"}`}
            width="16"
            height="16"
          />
        )}
        {activeCount > 0 && (
          <span className="text-accent flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] leading-none font-bold">
            {activeCount}
          </span>
        )}
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 transition-transform ${isOpen ? "text-primary rotate-180" : activeCount > 0 ? "text-primary" : "text-secondary"}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="border-border bg-bg absolute top-11 right-0 z-50 w-[360px] max-w-[90vw] rounded-2xl border p-5 shadow-lg md:w-lg md:max-w-lg"
        >
          <p className="text-primary mb-4 text-base font-semibold">
            {t("filter.title", "Filters")}
          </p>

          {/* Reward type */}
          <div className="mb-4">
            <p className="text-secondary mb-2 text-xs">
              {t("filter.rewardType", "Reward type")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Checkbox
                label={t("filter.reward", "Reward")}
                checked={draft.rewardType.includes("rewarded")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    rewardType: toggle(d.rewardType, "rewarded"),
                  }))
                }
              />
              <Checkbox
                label={t("filter.noReward", "No reward")}
                checked={draft.rewardType.includes("non_reward")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    rewardType: toggle(d.rewardType, "non_reward"),
                  }))
                }
              />
            </div>
          </div>

          {/* Response type */}
          <div className="mb-4">
            <p className="text-secondary mb-2 text-xs">
              {t("filter.responseType", "Response type")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Checkbox
                label={t("filter.multipleChoice", "Multiple choice")}
                checked={draft.eventType.includes("single_choice")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    eventType: toggle(d.eventType, "single_choice"),
                  }))
                }
              />
              <Checkbox
                label={t("filter.openEnded", "Open-ended")}
                checked={draft.eventType.includes("open")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    eventType: toggle(d.eventType, "open"),
                  }))
                }
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="mb-5">
            <p className="text-secondary mb-2 text-xs">
              {t("filter.visibility", "Visibility")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Checkbox
                label={t("filter.public", "Public")}
                checked={draft.visibility.includes("public")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    visibility: toggle(d.visibility, "public"),
                  }))
                }
              />
              <Checkbox
                label={t("filter.paidOnly", "Paid-only")}
                checked={draft.visibility.includes("paid_only")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    visibility: toggle(d.visibility, "paid_only"),
                  }))
                }
              />
              <Checkbox
                label={t("filter.creatorOnly", "Creator-only")}
                checked={draft.visibility.includes("creator_only")}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    visibility: toggle(d.visibility, "creator_only"),
                  }))
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="default"
              onClick={handleClearAll}
              disabled={draftCount === 0}
              className="text-secondary text-sm"
            >
              {t("filter.clearAll", "Clear all")}
            </Button>
            <Button
              type="primary"
              onClick={handleApply}
              className="rounded-xl px-5 text-sm font-medium"
            >
              {t("filter.apply", "Apply")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
