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
