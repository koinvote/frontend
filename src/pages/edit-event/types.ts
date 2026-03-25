import type { EventType } from "@/api/types";

export type EditEventState = {
  eventId: string;
  creatorAddress: string;
  title: string;
  description: string;
  hashtag: string; // comma-separated
  eventType: EventType;
  options?: string[];
};
