import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
          checked
            ? "border-accent bg-accent"
            : "border-border bg-surface"
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
      <span className="text-sm text-primary">{label}</span>
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
    <div className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
          isOpen || activeCount > 0
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface text-primary"
        }`}
      >
        {/* Filter icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M1 2.5h12M3 7h8M5.5 11.5h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold leading-none text-accent">
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
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          className="border-border bg-bg absolute right-0 top-11 z-50 w-[360px] max-w-[360px] rounded-2xl border p-5 shadow-lg md:w-[512px] md:max-w-[512px]"
        >
          <p className="mb-4 text-base font-semibold text-primary">
            {t("filter.title", "Filters")}
          </p>

          {/* Reward type */}
          <div className="mb-4">
            <p className="mb-2 text-xs text-secondary">
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
            <p className="mb-2 text-xs text-secondary">
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
            <p className="mb-2 text-xs text-secondary">
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
            <button
              type="button"
              onClick={handleClearAll}
              disabled={draftCount === 0}
              className="text-sm text-secondary transition-colors hover:text-primary disabled:opacity-40"
            >
              {t("filter.clearAll", "Clear all")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-xl bg-primary px-5 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-80"
            >
              {t("filter.apply", "Apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
