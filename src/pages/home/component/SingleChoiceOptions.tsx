import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { type EventOption } from "@/api/response";
import { satsToBtc } from "@/utils/formatter";

export interface SingleChoiceOptionsProps {
  options: EventOption[] | string[];
  eventId: string;
  t: (key: string, defaultValue: string) => string;
}

export function SingleChoiceOptions({
  options,
  eventId,
  t,
}: SingleChoiceOptionsProps) {
  const navigate = useNavigate();

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

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMore) {
      setIsExpanded((prev) => !prev);
    } else {
      navigate(`/event/${eventId}`);
    }
  };

  return (
    <section
      data-options-list
      className={`border-border mt-3 rounded-xl border bg-[rgba(var(--color-gray-450-rgb),0.5)] px-3 py-2 text-xs transition-colors md:text-sm ${
        hasMore
          ? "cursor-pointer md:hover:bg-gray-200 dark:md:hover:bg-[rgba(var(--color-gray-450-rgb),0.8)]"
          : ""
      }`}
      onClick={handleOptionsClick}
    >
      <div className="text-secondary mb-1 flex items-center justify-between text-[11px] md:text-xs">
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
          {index > 0 && <div className="border-border my-1 border-t" />}
          <div className="py-1">
            <p className="text-primary line-clamp-1 wrap-break-word">
              {typeof opt === "string" ? opt : opt.option_text}
            </p>
            <div className="text-secondary mt-1 flex flex-col gap-1 text-[11px] md:flex-row md:items-center md:justify-end">
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
