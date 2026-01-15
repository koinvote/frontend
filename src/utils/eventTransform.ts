// src/pages/home/utils/eventTransform.ts

import {
  type EventSummary,
  type TopReply,
} from "@/pages/create-event/types/index";
import type { EventListDataRes, TopReplyRes } from "@/api/response";

import { EventStatus } from "@/api/types";
import { satsToBtc } from "@/utils/formatter";

// Helper to convert satoshi to BTC string (without " BTC" suffix)
const satsToBtcString = (sats: number): string =>
  satsToBtc(sats, { suffix: false });

// Map backend API status to EventStatus
// 1=pending, 2=preheat, 3=active, 4=ended, 5=completed, 6=cancelled, 7=refunded, 8=expired
const mapApiStatusToEventStatus = (
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
):
  | typeof EventStatus.ACTIVE
  | typeof EventStatus.PREHEAT
  | typeof EventStatus.COMPLETED => {
  if (status === 2) return EventStatus.PREHEAT; // 2=preheat
  if (status === 3) return EventStatus.ACTIVE; // 3=active
  // 1=pending, 4=ended, 5=completed, 6=cancelled, 7=refunded, 8=expired are all treated as completed states
  return EventStatus.COMPLETED;
};

const mapHashtags = (tags: string[]): string[] =>
  tags.map((t) => (t.startsWith("#") ? t : `#${t}`));

// Map API TopReplyRes to TopReply
const mapApiTopReply = (r: TopReplyRes): TopReply => ({
  id: String(r.id),
  body: r.body,
  weight_percent: r.weight_percent,
  amount_satoshi: String(r.amount_satoshi),
});

// New function to map API response to EventSummary
export const mapApiEventToEventSummary = (
  ev: EventListDataRes
): EventSummary => ({
  id: ev.id,
  event_id: ev.event_id,
  event_type: ev.event_type,
  title: ev.title,
  description: ev.description,
  started_at: ev.started_at,
  status: mapApiStatusToEventStatus(ev.status),
  hashtags: mapHashtags(ev.hashtags),
  created_at: ev.created_at,
  deadline_at: ev.deadline_at,
  ended_at: undefined, // API doesn't return ended_at for list endpoint
  total_reward_btc: satsToBtcString(ev.total_reward_satoshi),
  participants_count: ev.participants_count,
  total_stake_btc: satsToBtcString(ev.total_stake_satoshi),
  top_replies: ev.top_replies.map(mapApiTopReply),
  options: ev.options ?? [],
});
