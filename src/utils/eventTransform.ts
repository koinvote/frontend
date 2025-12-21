// src/pages/home/utils/eventTransform.ts

import {
  type BackendEvent,
  type BackendTopReply,
  type EventSummary,
  type ReplyPreview,
} from "@/pages/create-event/types/index";
import type { EventListDataRes, TopReplyRes } from "@/api/response";

import { EventState } from "@/api/types";

const SATS_PER_BTC = 100_000_000;

const satsToBtcString = (sats: number): string =>
  (sats / SATS_PER_BTC).toFixed(8);

const mapStateCode = (
  code: 0 | 1
):
  | typeof EventState.ONGOING
  | typeof EventState.PREHEAT
  | typeof EventState.COMPLETED =>
  code === 1 ? EventState.ONGOING : EventState.COMPLETED;

// Map backend API state (1: preheat, 2: ongoing, 3: completed) to EventState
const mapApiStateToEventState = (
  state: 1 | 2 | 3
):
  | typeof EventState.ONGOING
  | typeof EventState.PREHEAT
  | typeof EventState.COMPLETED => {
  if (state === 1) return EventState.PREHEAT;
  if (state === 2) return EventState.ONGOING;
  return EventState.COMPLETED;
};

const mapHashtags = (tags: string[]): string[] =>
  tags.map((t) => (t.startsWith("#") ? t : `#${t}`));

const mapTopReply = (r: BackendTopReply): ReplyPreview => ({
  reply_id: String(r.id),
  body: r.body,
  weight_percent: r.weight_percent,
  amount_btc: satsToBtcString(r.amount_btc),
});

// Map API TopReplyRes to ReplyPreview
const mapApiTopReply = (r: TopReplyRes): ReplyPreview => ({
  reply_id: String(r.id),
  body: r.body,
  weight_percent: r.weight_percent,
  amount_btc: satsToBtcString(r.amount_satoshi),
});

// Legacy function for mock data (keeping for backward compatibility if needed)
export const mapBackendEventToEventSummary = (
  ev: BackendEvent
): EventSummary => ({
  event_id: ev.event_id,
  title: ev.title,
  description: ev.description,
  state: mapStateCode(ev.state),
  hashtags: mapHashtags(ev.hashtags),
  created_at: ev.created_at,
  deadline_at: ev.deadline_at,
  ended_at: ev.ended_at,
  total_reward_btc: satsToBtcString(ev.total_reward_btc),
  participants_count: ev.participants_count,
  total_stake_btc: satsToBtcString(ev.total_stake_btc),
  top_replies: ev.top_replies.map(mapTopReply),
});

// New function to map API response to EventSummary
export const mapApiEventToEventSummary = (
  ev: EventListDataRes
): EventSummary => ({
  event_id: ev.event_id,
  title: ev.title,
  description: ev.description,
  state: mapApiStateToEventState(ev.state),
  hashtags: mapHashtags(ev.hashtags),
  created_at: ev.created_at,
  deadline_at: ev.deadline_at,
  ended_at: undefined, // API doesn't return ended_at for list endpoint
  total_reward_btc: satsToBtcString(ev.total_reward_satoshi),
  participants_count: ev.participants_count,
  total_stake_btc: satsToBtcString(ev.total_stake_satoshi),
  top_replies: ev.top_replies.map(mapApiTopReply),
});
