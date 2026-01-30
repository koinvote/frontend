import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useHomeEvents } from "@/hooks/useHomeEvents";
import { EventCard } from "@/pages/home/component/EventCard";
import { useHomeStore } from "@/stores/homeStore";

export function EventList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Optimize selector to avoid re-rendering on every scroll update
  const setScrollY = useHomeStore((state) => state.setScrollY);
  const { events, isLoading, isError, hasMore, loadMore, reload } =
    useHomeEvents();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "200px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (isError) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-secondary">
        <span>{t("eventList.loadError", "Failed to load events.")}</span>
        <button
          type="button"
          onClick={reload}
          className="rounded-full bg-accent px-4 py-1.5 text-xs text-accent-foreground text-primary"
        >
          {t("eventList.retry", "Retry")}
        </button>
      </div>
    );
  }

  const isEmpty = !isLoading && events.length === 0;

  if (isEmpty) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-secondary">
        <span>{t("eventList.noEvents", "No events found for current filters.")}</span>
        <span className="text-xs">
          {t("eventList.noEventsHint", "Try clearing search or selecting a different status.")}
        </span>
      </div>
    );
  }
  return (
    <div className="mt-4 flex flex-col gap-4 md:gap-6">
      {events.map((event) => (
        <EventCard
          key={event.event_id}
          event={event}
          onClick={() => {
            // Save scroll position before navigation
            setScrollY(window.scrollY);
            navigate(`/event/${event.event_id}`);
          }}
        />
      ))}

      {/* loading / sentinel */}
      <div ref={sentinelRef} className="h-10 w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-xs text-secondary">
            {t("eventList.loading", "Loading...")}
          </div>
        )}
        {!hasMore && !isLoading && events.length > 0 && (
          <div className="flex h-full items-center justify-center text-[11px] text-secondary">
            {t("eventList.noMoreEvents", "No more events")}
          </div>
        )}
      </div>
    </div>
  );
}
