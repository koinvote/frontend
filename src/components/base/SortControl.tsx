import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type SortOrder = "asc" | "desc";

export interface SortOption<T extends string> {
  value: T;
  label: string;
  /**
   * Plain-language direction labels for this field (e.g. time → "Newest
   * first"/"Oldest first", amounts → "High to low"/"Low to high"). Falls
   * back to generic Ascending/Descending when omitted.
   */
  orderLabels?: Record<SortOrder, string>;
  /** Order applied when this field is picked (e.g. reward → "desc"). */
  defaultOrder?: SortOrder;
}

interface SortControlProps<T extends string> {
  options: SortOption<T>[];
  field: T;
  order: SortOrder;
  onChange: (field: T, order: SortOrder) => void;
  /** Sizing/placement classes for the root wrapper, e.g. "flex-1 md:w-[156px]" */
  className?: string;
}

function DirectionArrow({ order, className }: { order: SortOrder; className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {order === "asc" ? (
        <path
          d="M8 13V3M8 3L4.5 6.5M8 3L11.5 6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8 3V13M8 13L4.5 9.5M8 13L11.5 9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function CheckMark() {
  return (
    <svg
      width="12"
      height="9"
      viewBox="0 0 12 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M1 4L4.5 7.5L11 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Unified sort control: one button showing the active field and direction,
 * opening a single menu with a field section and an order section.
 * Visual language mirrors FilterButton (h-9, rounded-xl, accent fill when open).
 */
export function SortControl<T extends string>({
  options,
  field,
  order,
  onChange,
  className = "",
}: SortControlProps<T>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  // While the menu is open, taps edit this draft; the sort is applied once,
  // when the menu closes (order tap, outside tap, or re-tapping the button).
  const [draft, setDraft] = useState<{ field: T; order: SortOrder } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    setDraft({ field, order });
    setIsOpen(true);
  };

  const closeAndApply = (finalDraft?: { field: T; order: SortOrder }) => {
    const next = finalDraft ?? draft;
    if (next && (next.field !== field || next.order !== order)) {
      onChange(next.field, next.order);
    }
    setIsOpen(false);
    setDraft(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        closeAndApply();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draft]);

  // Face and menu both reflect the draft while it exists.
  const shownField = draft?.field ?? field;
  const shownOrder = draft?.order ?? order;
  const activeOption = options.find((opt) => opt.value === shownField);
  const activeLabel = activeOption?.label;

  const selectField = (opt: SortOption<T>) => {
    // Keep the menu open: field is step one, direction may follow. Picking a
    // field resets the draft direction to that field's sensible default.
    setDraft((d) => {
      if (!d || d.field === opt.value) return d;
      return { field: opt.value, order: opt.defaultOrder ?? d.order };
    });
  };

  const selectOrder = (value: SortOrder) => {
    // Direction is the final step — apply and close immediately.
    closeAndApply({ field: shownField, order: value });
  };

  // Direction wording follows the drafted field so it always reads naturally.
  const orderRows: { value: SortOrder; label: string }[] = [
    {
      value: "desc",
      label:
        activeOption?.orderLabels?.desc ??
        t("searchFilter.descending", "Descending"),
    },
    {
      value: "asc",
      label:
        activeOption?.orderLabels?.asc ??
        t("searchFilter.ascending", "Ascending"),
    },
  ];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (isOpen ? closeAndApply() : openMenu())}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={
          shownOrder === "desc"
            ? t("searchFilter.sortDesc", "Sort descending")
            : t("searchFilter.sortAsc", "Sort ascending")
        }
        className={`flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
          isOpen
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border bg-surface text-primary"
        }`}
      >
        <DirectionArrow
          order={shownOrder}
          className={`shrink-0 ${isOpen ? "text-accent-foreground" : "text-secondary"}`}
        />
        <span className="truncate font-medium capitalize">{activeLabel}</span>
        {/* Chevron — same inline chevron as FilterButton */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-accent-foreground" : "text-secondary"
          }`}
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
          role="menu"
          className="border-border bg-bg absolute top-11 right-0 z-50 w-48 rounded-xl border py-1 shadow-lg"
        >
          <p className="text-secondary px-3 pt-2 pb-1 text-xs">
            {t("searchFilter.sortBy", "Sort by")}
          </p>
          {options.map((opt) => {
            const isActive = opt.value === shownField;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => selectField(opt)}
                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10 ${
                  isActive ? "text-accent font-medium" : "text-primary"
                }`}
              >
                <span className="capitalize">{opt.label}</span>
                {isActive && <CheckMark />}
              </button>
            );
          })}

          <div className="border-border my-1 border-t" />

          <p className="text-secondary px-3 pt-1 pb-1 text-xs">
            {t("searchFilter.order", "Order")}
          </p>
          {orderRows.map((row) => {
            const isActive = row.value === shownOrder;
            return (
              <button
                key={row.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => selectOrder(row.value)}
                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10 ${
                  isActive ? "text-accent font-medium" : "text-primary"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <DirectionArrow order={row.value} className="shrink-0" />
                  {row.label}
                </span>
                {isActive && <CheckMark />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
