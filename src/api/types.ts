// api/types.ts

export type EventType = 'open' | 'single_choice'
export type EventRewardType = 'rewarded' | 'non_reward'


export const EventState = {
  PREHEAT: 1,
  ONGOING: 2,
  COMPLETED: 3,
} as const

export const EventSortBy = {
  TIME: 'time',
  REWARD: 'reward',
  PARTICIPATION: 'participation',
} as const

export const EventOrder = {
  DESC: 'desc',
  ASC: 'asc',
} as const