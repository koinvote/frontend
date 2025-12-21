// src/pages/home/types.ts
import type { EventState } from "@/api/types";

export interface ReplyPreview {
  reply_id: string;
  body: string;
  weight_percent: number;
  amount_btc: string;
}

export interface EventSummary {
  event_id: string;
  title: string;
  description: string;
  state:
    | typeof EventState.ONGOING
    | typeof EventState.PREHEAT
    | typeof EventState.COMPLETED;

  hashtags: string[];

  created_at: string;
  deadline_at: string;
  ended_at?: string;

  total_reward_btc: string;
  participants_count: number;
  total_stake_btc: string;

  top_replies: ReplyPreview[];
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
