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
  event_reward_type?: string[]; // e.g. ["rewarded", "non_reward"]
  event_type?: string[];         // e.g. ["single_choice", "open"]
  result_visibility?: string[];  // e.g. ["public", "paid_only", "creator_only"]
  locale?: string; // viewer language; server attaches pre-stored translations for it
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
  locale?: string; // viewer language; server attaches pre-stored translations for it
}

// Admin API Request Types
export interface AdminLoginChallengeReq {
  address: string;
}

export interface AdminLoginReq {
  address: string;
  plaintext: string;
  signature: string;
  /**
   * Identifies the challenge issued by POST /admin/login/challenge.
   *
   * Required. The server refuses a login without it with
   * LOGIN_NONCE_REQUIRED: a signature over a message the server never issued
   * has nothing to expire it, and stays a working credential forever.
   */
  nonce_timestamp: string;
}

export interface PasskeyRegisterBeginReq {
  plaintext: string;
  nonce_timestamp: string;
  signature: string;
}

export interface PasskeyRegisterFinishReq {
  challenge_id: string;
  label: string;
  // The raw PublicKeyCredential the browser produced, passed through unchanged
  // so the server's parser sees exactly what the authenticator sent.
  credential: unknown;
}

export interface PasskeyLoginFinishReq {
  challenge_id: string;
  credential: unknown;
}

export interface PasskeyRenameReq {
  label: string;
}

export interface UpdateSystemParametersReq {
  min_reward_sats: number;
  sats_per_extra_winner: number;
  sats_per_duration_hour: number;
  platform_fee_percent: number;
  min_payout_sats: number;
  free_hours: number;
}

/**
 * Proves the wallet or an enrolled passkey is present, right now.
 *
 * A session token says someone logged in within the last hour. Some actions
 * need more than that, and carry this in their body rather than exchanging it
 * for a token — so there is never an intermediate credential to steal, and the
 * proof and the action it authorises arrive together.
 *
 * Exactly one of the two groups is filled in. Every proof is single-use.
 */
export interface StepUpProof {
  // Wallet path.
  plaintext?: string;
  nonce_timestamp?: string;
  signature?: string;

  // Passkey path.
  challenge_id?: string;
  credential?: unknown;
}

/** Names the action a step-up authorises. Must match service.StepUpPurpose. */
export type StepUpPurpose = "passkey_register" | "system_parameters";

export interface StepUpChallengeReq {
  purpose: StepUpPurpose;
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
  referral_code?: string;
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

export interface VerifyChangeVisibilityPlaintextReq {
  email: string;
  plaintext: string;
  signature: string;
}

export interface GenerateUnlockPricePlaintextReq {
  email: string;
  unlock_price_satoshi: number;
}

export interface GenerateEditPlaintextReq {
  title: string;
  description: string;
  event_type: EventType;
  options?: string[];
  hashtags?: string[];
}

export interface UpdateEventReq {
  title: string;
  description: string;
  event_type: EventType;
  options?: string[];
  hashtags?: string[];
  plaintext: string;
  signature: string;
}

export interface UpdateUnlockPriceReq {
  email: string;
  unlock_price_satoshi: number;
  plaintext: string;
  signature: string;
}

export interface GetReferralCodesReq {
  page?: number;
  limit?: number;
}

export interface CreateReferralCodeReq {
  code: string;
}
