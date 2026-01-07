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
  tag?: string;
  page: string;
  limit: string;
  sortBy: "time" | "reward" | "participation";
  order: "desc" | "asc";
}

export interface GetListRepliesReq {
  event_id: string;
  search?: string;
  sortBy?: "time" | "balance"; // default: balance
  order?: "desc" | "asc"; // default: desc
  page?: number; // default: 1
  limit?: number; // default: 20, max: 100
}

// Admin API Request Types
export interface AdminLoginReq {
  address: string;
  plaintext: string;
  signature: string;
}

export interface UpdateSystemParametersReq {
  min_reward_sats: number;
  sats_per_extra_winner: number;
  sats_per_duration_hour: number;
  platform_fee_percent: number;
  min_payout_sats: number;
  free_hours: number;
}

export interface VerifySignatureReq {
  signature: string;
}

export interface SubmitReplyReq {
  event_id: string;
  btc_address: string;
  content?: string; // For open-ended
  option_id?: number; // For single-choice
  plaintext: string;
  signature: string;
  nonce_timestamp: string;
  random_code: string;
}

export interface GenerateReplyPlaintextReq {
  event_id: string;
  btc_address: string;
  option_id?: number; // For single-choice
  content?: string; // For open-ended
}
