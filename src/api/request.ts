// api/request.ts
import type { EventRewardType, EventType } from "./types";

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
  result_visibility?: "public" | "paid_only" | "creator_only";
  creator_email?: string;
  unlock_price_satoshi?: number;
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
  search?: string; //Search supports partial matching on BTC address, reply content, and option text
  sortBy?: "time" | "balance"; // Default sorting is by balance (descending), then by creation time
  order?: "desc" | "asc"; // default: desc
  page?: number; // default: 1
  limit?: number; // default: 20, max: 100
  balance_type?: "snapshot" | "current";
  unlock_email?: string;
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

export interface SubscribeReq {
  email: string;
}

export interface ContactUsReq {
  email: string;
  subject: string;
  message?: string;
}

export interface CreateWithdrawalReq {
  admin_address: string;
  hash_key: string;
  signature: string;
}

export interface GetWithdrawalRecordReq {
  page?: string;
  limit?: string;
  to_address?: string;
  start_time?: string;
  end_time?: string;
}

export interface UnlockEventReq {
  email: string;
}

export interface GenerateChangeVisibilityPlaintextReq {
  email: string;
  result_visibility: "paid_only" | "public";
  unlock_price_satoshi?: number; // required when result_visibility is "paid_only"
}

export interface UpdateResultVisibilityReq {
  email: string;
  result_visibility: "paid_only" | "public";
  unlock_price_satoshi?: number; // required when result_visibility is "paid_only"
  plaintext: string;
  signature: string;
}

export interface GenerateUnlockPricePlaintextReq {
  email: string;
  unlock_price_satoshi: number;
}

export interface UpdateUnlockPriceReq {
  email: string;
  unlock_price_satoshi: number;
  plaintext: string;
  signature: string;
}
