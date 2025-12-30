import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { API, type ApiResponse } from "@/api";
import { ReplySortBy } from "@/api/types";
import type { EventDetailDataRes } from "@/api/response";
import { EventInfo } from "./components/EventInfo";
import { Divider } from "./components/Divider";
import { SearchAndFilter } from "./components/SearchAndFilter";
import { ReplyList } from "./components/ReplyList";
import { PageLoading } from "@/components/PageLoading";
import CircleLeftIcon from "@/assets/icons/circle-left.svg?react";

const EventDetail = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME
  >(ReplySortBy.BALANCE);
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const {
    data: eventDetail,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = (await API.getEventDetail(
        eventId
      )()) as unknown as ApiResponse<EventDetailDataRes>;
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch event detail");
      }
      return response.data;
    },
    enabled: !!eventId,
  });

  console.log(eventDetail);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handleSortChange = (
    newSortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME,
    newOrder: "desc" | "asc"
  ) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
  };

  if (isLoadingEvent) {
    return <PageLoading />;
  }

  if (eventError || !eventDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-secondary mb-2">Failed to load event</p>
          <p className="text-sm text-secondary">
            {eventError instanceof Error ? eventError.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col flex items-center justify-center w-full px-2 md:px-0">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>
      <div className="w-full max-w-3xl rounded-3xl border border-gray-450 bg-bg px-6 py-6 md:px-8 md:py-8">
        {/* First Section: Event Info */}
        <EventInfo event={eventDetail} />

        {/* Divider */}
        <div className="my-6 md:my-8">
          <Divider />
        </div>

        {/* Second Section: Search and Filter */}
        <SearchAndFilter
          eventId={eventId!}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
        />

        {/* Third Section: Reply List */}
        <ReplyList
          eventId={eventId!}
          search={search}
          sortBy={sortBy}
          order={order}
        />
      </div>
    </div>
  );
};

export default EventDetail;
