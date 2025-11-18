export type EventState = 'ACTIVE' | 'CLOSED'

export interface ReplyPreview {
  reply_id: string
  body: string
  weight_percent: number // 0–100
  amount_btc: string
}

export interface EventSummary {
  event_id: string
  title: string
  description: string
  state: EventState

  hashtags: string[]

  created_at: string
  deadline_at: string
  ended_at?: string

  total_reward_btc: string
  participants_count: number
  total_stake_btc: string

  top_replies: ReplyPreview[]
}

export type HomeStatusFilter = 'ongoing' | 'completed'

export type HomeSortField = 'time' | 'bounty' | 'participation'
export type HomeSortOrder = 'asc' | 'desc'

export interface GetEventsParams {
  status: HomeStatusFilter
  search?: string
  sortField?: HomeSortField
  sortOrder?: HomeSortOrder
  hashtag?: string | null
  offset?: number
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}
