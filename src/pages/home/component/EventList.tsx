import { useEffect, useRef, useMemo } from "react";
import { useHomeEvents } from "@/hooks/useHomeEvents";
import { EventCard } from "@/pages/home/component/EventCard";
import { useHomeStore } from "@/stores/homeStore";
import { EventState } from "@/api/types";

export function EventList() {
  const { events, isLoading, isError, hasMore, loadMore, reload } =
    useHomeEvents();
  const { status } = useHomeStore();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filter events by current status according to API doc:
  // state: 1 (preheat), 2 (ongoing), 3 (completed)
  const filteredEvents = useMemo(() => {
    const expectedState =
      status === "preheat"
        ? EventState.PREHEAT
        : status === "ongoing"
        ? EventState.ONGOING
        : EventState.COMPLETED;

    return events.filter((event) => event.state === expectedState);
  }, [events, status]);

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
        <span>Failed to load events.</span>
        <button
          type="button"
          onClick={reload}
          className="rounded-full bg-accent px-4 py-1.5 text-xs text-accent-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const isEmpty = !isLoading && filteredEvents.length === 0;

  if (isEmpty) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-secondary">
        <span>No events found for current filters.</span>
        <span className="text-xs">
          Try clearing search or selecting a different status.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4 md:gap-6">
      {filteredEvents.map((event) => (
        <EventCard
          key={event.event_id}
          event={event}
          onClick={() => {
            // TODO: 之後接到 /event/:id 詳情頁
            console.log("click event", event.event_id);
          }}
        />
      ))}

      {/* loading / sentinel */}
      <div ref={sentinelRef} className="h-10 w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-xs text-secondary">
            Loading...
          </div>
        )}
        {!hasMore && !isLoading && filteredEvents.length > 0 && (
          <div className="flex h-full items-center justify-center text-[11px] text-secondary">
            No more events
          </div>
        )}
      </div>
    </div>
  );
}
