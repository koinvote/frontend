// api/response.ts
import type { ReplyPreview } from "@/pages/home/types"
import type { EventType, EventRewardType, EventState } from "./types"

export interface SystemConfigRes {
    maintenance_mode: boolean
    min_reward_amount_satoshi: number
    satoshi_per_extra_winner: number
    dust_threshold_satoshi: number
    satoshi_per_duration_hour: number
    free_hours: number
    platform_fee_percentage: number
    refund_service_fee_percentage: number
}

export interface EventDataRes {
    event_id: string
    title: string
    description: string
    event_type: EventType
    event_reward_type: EventRewardType
    initial_reward_satoshi: number
    total_reward_satoshi: number
    winner_count: number
    duration_hours: number
    status: number
    refund_address: string
    deposit_address: string
    deadline_at: string
    created_at: string
    preheat_hours: number
    preheat_fee_satoshi: number
    total_cost_satoshi: number
  }
  export interface EventListDataRes {
    id: number
    event_id: string
    title: string
    description: string
    state: (typeof EventState.ONGOING) | (typeof EventState.PREHEAT) | (typeof EventState.COMPLETED)
    hashtags: string[]
    created_at: string
    deadline_at: string
    total_reward_satoshi: number
    participants_count: number
    total_stake_satoshi: number
    top_replies: ReplyPreview[]
  }

  export interface GetEventListRes {
    events: EventListDataRes[]
    page: number
    limit: number
  }

  export interface EventDetailDataRes {
    id: number
    event_id: string
    title: string
    description: string
    event_type: EventType
    event_reward_type: EventRewardType
    status: (typeof EventState.ONGOING) | (typeof EventState.PREHEAT) | (typeof EventState.COMPLETED)
    initial_reward_satoshi: number
    total_reward_satoshi: number
    winner_count: number
    duration_hours: number
    created_at: string
    started_at: string
    deadline_at: string
    participants_count: number
    total_stake_satoshi: number
    options: string[]
    top_replies: ReplyPreview[]
    hashtags: string[]
    preheat_hours: number
  }