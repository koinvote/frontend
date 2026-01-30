// api/response.ts
import type { TopReply } from "@/pages/create-event/types";
import type {
  DepositStatus,
  EventRewardType,
  EventStatus,
  EventType,
} from "./types";

export interface SystemConfigRes {
  min_reward_amount_satoshi: number; //最低發起金額
  satoshi_per_extra_winner: number; //中獎地址數/獎金金額比例
  satoshi_per_duration_hour: number; //活動最長存續時間/獎金金額比例
  dust_threshold_satoshi: number; //最低派獎門檻（Dust Rule）
  free_hours: number; //免費時長
  platform_fee_percentage: number; //平台服務費比例
  refund_service_fee_percentage: number; //退款處理費比例
  payout_fee_multiplier: number; //派獎手續費倍數
  refund_fee_multiplier: number; //退款手續費倍數
  withdrawal_fee_multiplier: number; //提款手續費倍數
  maintenance_mode: boolean; //維護模式
  required_confirmations: number; //所需確認數
}

export interface EventDataRes {
  event_id: string;
  title: string;
  description: string;
  event_type: EventType;
  event_reward_type: EventRewardType;
  initial_reward_satoshi: number;
  total_reward_satoshi: number;
  winner_count: number;
  duration_hours: number;
  status:
    | typeof EventStatus.PENDING
    | typeof EventStatus.PREHEAT
    | typeof EventStatus.ACTIVE
    | typeof EventStatus.ENDED
    | typeof EventStatus.COMPLETED
    | typeof EventStatus.CANCELLED
    | typeof EventStatus.REFUNDED
    | typeof EventStatus.EXPIRED;
  creator_address: string;
  deposit_address: string;
  deadline_at: string;
  created_at: string;
  hashtags: string[];
  preheat_hours: number;
  preheat_fee_satoshi: number;
  total_cost_satoshi: number;
}

export interface TopReplyRes {
  id: number;
  body: string;
  weight_percent: number;
  amount_satoshi: number;
}

export interface EventListDataRes {
  id: number;
  event_reward_type: EventRewardType;
  event_type: EventType;
  event_id: string;
  title: string;
  description: string;
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 1=pending, 2=preheat, 3=active, 4=ended(已結束，等待派獎), 5=completed(已結束，派獎完成), 6=cancelled, 7=refunded, 8=expired
  hashtags: string[];
  created_at: string;
  preheat_start_at: string;
  started_at: string;
  deadline_at: string;
  ended_at: string;
  updated_at: string;
  total_reward_satoshi: number;
  participants_count: number;
  total_stake_satoshi: number;
  top_replies: TopReplyRes[];
  options: EventOption[] | string[]; // Allow both for compatibility or if backend changes
}

export interface GetEventListRes {
  events: EventListDataRes[];
  page: number;
  limit: number;
}

export interface EventOption {
  id: number;
  option_text: string;
  order: number;
  weight_percent: number;
  total_stake_satoshi: number;
}

export interface EventDetailDataRes {
  id: number;
  event_id: string;
  title: string;
  description: string;
  event_type: EventType;
  event_reward_type: EventRewardType;
  status:
    | typeof EventStatus.ACTIVE
    | typeof EventStatus.PREHEAT
    | typeof EventStatus.ENDED
    | typeof EventStatus.COMPLETED;
  initial_reward_satoshi: number; //事件建立時的初始獎金
  additional_reward_satoshi: number; //額外獎金
  total_reward_satoshi: number; //total reward指的是總獎金
  winner_count: number;
  additional_winner_count: number;
  max_recipient?: number; // Added based on UI requirement
  duration_hours: number;
  creator_address: string;
  created_at: string;
  started_at: string;
  deadline_at: string;
  participants_count: number;
  total_stake_satoshi: number; //所有有參與回覆的人，錢包加起來總共有多少餘額
  options: EventOption[] | string[]; // Allow both for compatibility or if backend changes
  top_replies: TopReply[];
  hashtags: string[];
  preheat_hours: number;
}

export interface GetSignaturePlainTextRes {
  event_id: string;
  plaintext: string;
  timestamp: number;
}

export interface VerifySignatureRes {
  event_id: string;
  message: string;
  status: number | string; // Can be 1 (number) or "activated" (string)
}

export interface DepositStatusRes {
  event_id: string;
  deposit_address: string;
  expected_amount_satoshi: number;
  received_amount_satoshi: number;
  status:
    | typeof DepositStatus.PENDING
    | typeof DepositStatus.UNCONFIRMED
    | typeof DepositStatus.RECEIVED
    | typeof DepositStatus.DONATION
    | typeof DepositStatus.WAIT_FOR_REFUND
    | typeof DepositStatus.EXPIRED
    | typeof DepositStatus.FROZEN;
  confirmed_at: string;
  received_txid: string;
  deposit_timeout_at: string;
  first_seen_at: string;
  block_height: number;
  deposit_type: string;
}

export interface GetListRepliesRes {
  replies: Reply[];
  page: number;
  limit: number;
}

export interface Reply {
  id: number;
  event_id: string;
  btc_address: string;
  option_id?: number;
  content?: string;
  content_hash?: string;
  plaintext: string;
  signature: string;
  nonce_timestamp: string;
  random_code: string;
  is_reply_valid: boolean;
  balance_at_reply_satoshi: number; //Balance when reply was submitted
  balance_at_snapshot_satoshi: number; //Balance at event snapshot time
  balance_at_current_satoshi: number; //Current real-time balance
  balance_last_updated_at: string;
  is_hidden: boolean;
  hidden_at: string;
  hidden_by_admin_id: string;
  created_at: string;
  created_by_ip: string;
  updated_at: string;
}

export interface GetReplyPlainTextRes {
  plaintext: string; // "koinvote.com | type:single | Option A | EVT_20241203_ABC123 | 1701612345 | 123456"
  nonce_timestamp: string; // "1701612345"
  random_code: string; //123456
}

export type GetHotHashtagsRes = string[];

// Admin API Response Types
export interface AdminLoginRes {
  token: string;
}

export interface AdminSystemParametersRes {
  min_reward_amount_satoshi: number; // 最低發起獎金金額
  satoshi_per_extra_winner: number; //中獎地址數 / 金額比例
  satoshi_per_duration_hour: number; //活動最長存續時間 / 獎金金額比例 ( 多少BTC對應1小時)
  dust_threshold_satoshi: number; //最低派獎門檻
  free_hours: number; //免費時長
  platform_fee_percentage: number; // 平台手續費百分比
  refund_service_fee_percentage: number; //退款服務費百分比
  payout_fee_multiplier: number; //派獎手續費倍數
  refund_fee_multiplier: number; //退款手續費倍數
  withdrawal_fee_multiplier: number; //提款手續費倍數
  maintenance_mode: boolean; //維護模式
  required_confirmations: number; //所需確認數
}

// Payout Report Types
export type PayoutStatus =
  | "completed" // 已完成派獎
  | "processing" // 派獎處理中
  | "dust_redistributed" // 低於 dust 門檻，獎金重分配給其他中獎者
  | "failed" // 派獎失敗
  | "pending"; // 等待派獎

export type RewardType = "initial" | "additional";

export interface PayoutWinner {
  balance_at_snapshot_satoshi: number;
  distributable_rate: number;
  final_reward_satoshi: number;
  is_dust: boolean;
  original_reward_satoshi: number;
  status: PayoutStatus;
  winner_address: string;
  win_probability_percent: number;
}

export interface RewardDetail {
  csv_sha256: string;
  distributable_satoshi: number;
  dust_redistribute_amount_satoshi: number;
  dust_winner_count: number;
  estimated_miner_fee_satoshi: number;
  original_amount_satoshi: number;
  payout_txid: string;
  plan_id: number;
  platform_fee_satoshi: number;
  reward_type: RewardType;
  winner_count: number;
  winners: PayoutWinner[];
}

export interface PayoutReportRes {
  event_id: string;
  event_title: string;
  snapshot_block_height: number;
  initial_reward_satoshi: number;
  additional_reward_1_satoshi: number;
  additional_reward_2_satoshi: number;
  total_reward_pool_satoshi: number;
  reward_details: RewardDetail[];
}
