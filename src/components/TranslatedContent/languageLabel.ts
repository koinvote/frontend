import type { TFunction } from "i18next";

import { SUPPORTED_LANGUAGES } from "@/i18n";

/**
 * Chinese arrives from the backend as a regional code (the detector answers
 * zh-TW / zh-CN); everything else collapses to its base language. Kept as a
 * map so future special cases have a place to live.
 */
const REGIONAL_TO_APP: Record<string, string> = {
  "zh-tw": "zh",
  "zh-cn": "zh",
  "zh-hant": "zh",
  "zh-hans": "zh",
};

/**
 * Localized display name of a translation's source language, e.g. "英文" for
 * "en" when the UI is Chinese. Returns null when the language is unknown to
 * the app — the caller then falls back to a plain "machine translated" label
 * instead of claiming a wrong source.
 */
export function sourceLanguageLabel(
  t: TFunction,
  sourceLocale: string | undefined,
): string | null {
  if (!sourceLocale) return null;
  const lower = sourceLocale.toLowerCase();
  const app = REGIONAL_TO_APP[lower] ?? lower.split("-")[0];
  if (!SUPPORTED_LANGUAGES.some((lang) => lang.code === app)) return null;
  const name = t(`contentTranslation.languageNames.${app}`, "");
  return name || null;
}
