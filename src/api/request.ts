// api/request.ts
import type { EventType, EventRewardType, ReplySortBy } from "./types";

export interface CreateEventReq {
  title: string;
  description: string;
  event_type: EventType;
  event_reward_type: EventRewardType;
  initial_reward_satoshi: number;
  duration_hours: number;
  creator_address: string;
  options?: string[];
  preheat_hours?: number;
  hashtags?: string[];
}

export interface GetEventListReq {
  tab: "preheat" | "ongoing" | "completed";
  q: string;
  page: string;
  limit: string;
  sortBy: "time" | "reward" | "participation";
  order: "desc" | "asc";
}

export interface GetListRepliesReq {
  page: number;
  limit: number;
  q?: string;
  address?: string;
  sortBy: typeof ReplySortBy.BALANCE | typeof ReplySortBy.TIME; //default balance
  order: "desc" | "asc"; //default desc
}