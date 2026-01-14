// src/pages/home/types.ts
import type { EventStatus } from "@/api/types";
import type { EventOption } from "@/api/response";

export interface TopReply {
  id: string;
  body: string;
  weight_percent: number;
  amount_satoshi: string;
}

export interface EventSummary {
  id: number;
  event_id: string;
  title: string;
  description: string;
  status:
    | typeof EventStatus.ACTIVE
    | typeof EventStatus.PREHEAT
    | typeof EventStatus.COMPLETED;

  hashtags: string[];

  created_at: string;
  deadline_at: string;
  ended_at?: string;

  total_reward_btc: string;
  participants_count: number;
  total_stake_btc: string;

  top_replies: TopReply[];
  event_type: "open" | "single_choice";
  options: EventOption[] | string[];
}

// Home 狀態、排序（UI）
export type HomeStatusFilter = "preheat" | "ongoing" | "completed";
export type HomeSortField = "time" | "reward" | "participation";
export type HomeSortOrder = "asc" | "desc";

// front-end 自己用的分頁結果
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ===== 後端回傳型別 (新加) =====

export type EventStateCode = 0 | 1; // 0=closed, 1=active

export interface BackendTopReply {
  id: number; // reply id
  body: string;
  weight_percent: number;
  amount_btc: number; // sats
}

export interface BackendEvent {
  id: number; // event internal id
  event_id: string;
  title: string;
  description: string;
  state: EventStateCode;
  hashtags: string[]; // ["bitcoin", "mining"] no '#'
  created_at: string;
  deadline_at: string;
  ended_at?: string;

  total_reward_btc: number; // sats
  participants_count: number;
  total_stake_btc: number; // sats

  top_replies: BackendTopReply[];
}

export interface BackendGetEventsResponse {
  code: string;
  success: boolean;
  message: string | null;
  data: BackendEvent[];
}

export type AddressValidationStatus = "idle" | "checking" | "valid" | "invalid";
