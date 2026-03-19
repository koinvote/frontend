import type { EventType } from "@/api/types";

export type ResultVisibility = "public" | "paid_only" | "creator_only";

export type PreviewEventState = {
  creatorAddress: string;
  title: string;
  description: string;
  hashtag: string;
  eventType: EventType;
  isRewarded: boolean;
  rewardBtc?: string;
  maxRecipient?: number;
  durationHours: number;
  options?: string[];
  enablePreheat: boolean;
  preheatHours?: number;
  resultVisibility: ResultVisibility;
  creatorEmail?: string;
  unlockPriceBtc?: string;
};

export type CreateEventDraft = {
  creatorAddress: string;
  title: string;
  description: string;
  hashtags: string;
  eventType: EventType;
  isRewarded: boolean;
  rewardBtc: string;
  options: string[];
  durationHours: string;
  enablePreheat: boolean;
  preheatHours: string;
  agree: boolean;
  resultVisibility: ResultVisibility;
  creatorEmail: string;
  unlockPriceBtc: string;
};

export type CreateEventFormValues = {
  creatorAddress: string;
  title: string;
  description: string;
  eventType: EventType;
  options: { value: string }[];
  isRewarded: boolean;
  durationHours: string;
  rewardBtc: string;
  enablePreheat: boolean;
  preheatHours: string;
  agree: boolean;
  resultVisibility: ResultVisibility;
  creatorEmail: string;
  unlockPriceBtc: string;
};

export const CREATE_EVENT_DRAFT_KEY = "koinvote:create-event-draft";

export const DEFAULT_VALUES: CreateEventFormValues = {
  creatorAddress: "",
  title: "",
  description: "",
  eventType: "single_choice",
  options: [{ value: "" }],
  isRewarded: true,
  durationHours: "",
  rewardBtc: "",
  enablePreheat: false,
  preheatHours: "",
  agree: false,
  resultVisibility: "public",
  creatorEmail: "",
  unlockPriceBtc: "",
};
