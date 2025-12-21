// api/request.ts
import type {
  EventType,
  EventRewardType,
} from "./types";

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
  state: "1" | "2" | "3"; // 1: preheat, 2: ongoing, 3: completed
  q: string;
  page: string;
  limit: string;
  sortBy: "time" | "reward" | "participation";
  order: "desc" | "asc";
}
