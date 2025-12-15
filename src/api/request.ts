// api/request.ts
import type { EventType, EventRewardType } from './types'

export interface CreateEventReq {
    title: string
    description: string
    event_type: EventType
    event_reward_type: EventRewardType
    initial_reward_satoshi: number
    duration_hours: number
    refund_address: string

    options?: string[]
    preheat_hours?: number
  }
  
export interface GetEventListReq {
    state: number
    q: string
    page: number
    limit: number
    sortBy: string
    order: string
  }
  