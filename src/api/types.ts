// api/types.ts

export type EventType = "open" | "single_choice";
export type EventRewardType = "rewarded" | "non_reward";

export const EventSortBy = {
  TIME: "time",
  REWARD: "reward",
  PARTICIPATION: "participation",
} as const;

export const EventOrder = {
  DESC: "desc",
  ASC: "asc",
} as const;

export const EventStatus = {
  PENDING: 1,
  PREHEAT: 2,
  ACTIVE: 3,
  ENDED: 4,
  COMPLETED: 5,
  CANCELLED: 6,
  REFUNDED: 7,
  EXPIRED: 8,
} as const;

export const DepositStatus = {
  PENDING: "pending",
  UNCONFIRMED: "unconfirmed",
  RECEIVED: "received",
  DONATION: "donation",
  WAIT_FOR_REFUND: "wait_for_refund",
  EXPIRED: "expired",
  FROZEN: "frozen",
} as const;

export const ReplySortBy = {
  BALANCE: "balance",
  TIME: "time",
} as const;
