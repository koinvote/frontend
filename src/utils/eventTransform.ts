// src/pages/home/utils/eventTransform.ts

import {
  type BackendEvent,
  type BackendTopReply,
  type EventSummary,
  type ReplyPreview,
} from "@/pages/create-event/types/index";

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

const mapHashtags = (tags: string[]): string[] =>
  tags.map((t) => (t.startsWith("#") ? t : `#${t}`));

const mapTopReply = (r: BackendTopReply): ReplyPreview => ({
  reply_id: String(r.id),
  body: r.body,
  weight_percent: r.weight_percent,
  amount_btc: satsToBtcString(r.amount_btc),
});

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
