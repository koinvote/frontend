import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const SATS_PER_BTC = 100_000_000;

/** BTC -> sats*/
export const btcToSats = (value: string) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round(num * SATS_PER_BTC);
};

/**
 * Convert Satoshi to BTC string for display
 * @param satoshi - Satoshi value (number or null/undefined)
 * @param options - Formatting options
 * @param options.decimals - Number of decimal places (default: 8)
 * @param options.suffix - Whether to append " BTC" suffix (default: true)
 * @param options.showZero - Whether to show "0 BTC" for zero values (default: true)
 * @returns Formatted BTC string (e.g., "0.00012345 BTC") or "--" for invalid/null values
 */
export const satsToBtc = (
  satoshi: number | null | undefined,
  options?: {
    decimals?: number;
    suffix?: boolean;
    showZero?: boolean;
  }
): string => {
  const { decimals = 8, suffix = true, showZero = true } = options ?? {};

  // Handle null/undefined
  if (satoshi === null || satoshi === undefined) {
    return "--";
  }

  // Handle invalid numbers
  if (!Number.isFinite(satoshi)) {
    return "--";
  }

  // Handle zero
  if (satoshi === 0) {
    return showZero ? (suffix ? "0 BTC" : "0") : "--";
  }

  // Convert to BTC
  const btc = satoshi / SATS_PER_BTC;
  const formatted = btc.toFixed(decimals);
  return suffix ? `${formatted} BTC` : formatted;
};

/**
 * Format preheat duration: 一律進位，最大單位 w，最小單位 hr
 */
export const formatPreheatDuration = (hours: number): string => {
  if (hours <= 0) return "0hr";

  // 一律進位（向上取整）
  const roundedHours = Math.ceil(hours);

  // 計算週數（1週 = 168小時）
  const weeks = Math.floor(roundedHours / 168);
  const remainingHours = roundedHours % 168;

  if (weeks > 0 && remainingHours === 0) {
    return `${weeks}w`;
  }
  if (weeks > 0) {
    return `${weeks}w ${remainingHours}hr`;
  }
  return `${remainingHours}hr`;
};

/**
 * Format duration from started_at to deadline_at: 用 w d hr 呈現，最小單位 hr
 */
export const formatEventDuration = (
  startedAt: string,
  deadlineAt: string
): string => {
  const start = dayjs.utc(startedAt);
  const deadline = dayjs.utc(deadlineAt);
  const diffHours = deadline.diff(start, "hour");

  if (diffHours <= 0) return "0hr";

  const weeks = Math.floor(diffHours / (24 * 7));
  const remainingAfterWeeks = diffHours % (24 * 7);
  const days = Math.floor(remainingAfterWeeks / 24);
  const hours = remainingAfterWeeks % 24;

  const parts: string[] = [];
  if (weeks > 0) {
    parts.push(`${weeks}w`);
  }
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || parts.length === 0) {
    parts.push(`${hours}h`);
  }

  return parts.join(" ");
};

/**
 * Format preheat countdown: 從 started_at + preheat_hours 計算，最小單位是秒
 */
export const formatPreheatCountdown = (
  startedAt: string,
  preheatHours: number
): string => {
  const start = dayjs.utc(startedAt);
  const preheatEnd = start.add(preheatHours, "hour");
  const now = dayjs();
  const diffMs = preheatEnd.diff(now);

  if (diffMs <= 0) {
    return "0s";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Format ongoing countdown: 從 deadline_at 計算，最小單位是秒
 */
export const formatOngoingCountdown = (deadlineAt: string): string => {
  const deadline = dayjs.utc(deadlineAt);
  const now = dayjs();
  const diffMs = deadline.diff(now);

  if (diffMs <= 0) {
    return "0s";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * Format completed time: "Ended on Jan 3, 2025 — 14:32 UTC"
 */
export const formatCompletedTime = (deadlineAt: string): string => {
  const deadline = dayjs.utc(deadlineAt);
  const dateStr = deadline.format("MMM D, YYYY");
  const timeStr = deadline.format("HH:mm");
  return `Ended on ${dateStr} — ${timeStr} UTC`;
};
