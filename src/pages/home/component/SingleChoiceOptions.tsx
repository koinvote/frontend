import { useMemo, useState } from "react";

import { type EventOption } from "@/api/response";
import { satsToBtc } from "@/utils/formatter";

export interface SingleChoiceOptionsProps {
  options: EventOption[] | string[];
  t: (key: string, defaultValue: string) => string;
}

export function SingleChoiceOptions({ options, t }: SingleChoiceOptionsProps) {
  const sortedOptions = useMemo(() => {
    const allObjects =
      Array.isArray(options) &&
      options.every((opt) => typeof opt === "object" && opt !== null);
    if (!allObjects) return options;

    return [...options].sort((a, b) => {
      const wa = typeof a === "object" ? a.weight_percent : 0;
      const wb = typeof b === "object" ? b.weight_percent : 0;
      return wb - wa; // descending
    });
  }, [options]);

  const [isExpanded, setIsExpanded] = useState(false);

  const displayOptions = isExpanded ? sortedOptions : sortedOptions.slice(0, 2);
  const hasMore = sortedOptions.length > 2;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMore) setIsExpanded((prev) => !prev);
  };

  return (
    <section
      data-options-list
      className={`mt-3 rounded-xl border border-border px-3 py-2 text-xs md:text-sm bg-[rgba(var(--color-gray-450-rgb),0.5)] transition-colors ${
        hasMore
          ? "cursor-pointer dark:md:hover:bg-[rgba(var(--color-gray-450-rgb),0.8)] md:hover:bg-gray-200"
          : ""
      }`}
      onClick={handleToggle}
    >
      <div className="mb-1 text-[11px] md:text-xs text-secondary flex items-center justify-between">
        <span>
          {sortedOptions.length > 1
            ? t("eventCard.options", "Options")
            : t("eventCard.option", "Option")}
        </span>
        {hasMore && (
          <span className="flex items-center gap-1">
            {isExpanded
              ? t("eventCard.viewLess", "View less")
              : t("eventCard.viewAll", "View all")}
          </span>
        )}
      </div>

      {displayOptions.map((opt, index) => (
        <div key={index}>
          {index > 0 && <div className="my-1 border-t border-border" />}
          <div className="py-1">
            <p className="text-primary wrap-break-word line-clamp-1">
              {typeof opt === "string" ? opt : opt.option_text}
            </p>
            <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-end text-[11px] text-secondary">
              <div className="flex items-center justify-end gap-2 md:gap-2">
                {typeof opt !== "string" && (
                  <>
                    <span>
                      {t("eventCard.weight", "Weight:")}{" "}
                      {Number(opt.weight_percent.toFixed(2))}%
                    </span>
                    <span>
                      {t("eventCard.amount", "Amount:")}{" "}
                      {satsToBtc(opt.total_stake_satoshi, {
                        suffix: false,
                      })}{" "}
                      BTC
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
