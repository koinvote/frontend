/**
 * One deterministic answer to "which language should this page be in".
 *
 * Nothing in here touches the DOM or the network: the browser-side sources —
 * the preference cookie, `navigator.languages`, whatever the edge knows about
 * the country — live in `./localePreference`, and the list of languages the
 * site ships lives in `@/i18n`. This file is a pure function of what it is
 * handed, which is what makes the priority order testable without a browser.
 *
 * The list of supported locales is a parameter rather than an import on
 * purpose. It keeps the one registry in `@/i18n` canonical — there is no
 * second list here to fall out of step with it — and it lets a test drive the
 * matcher with locales the site does not ship yet.
 */

/**
 * Which language to show someone whose browser asked for nothing we have, by
 * the country their request came from.
 *
 * Keys are ISO 3166-1 alpha-2. Values are locale tags, not necessarily ones
 * the registry carries today: a row whose language the site does not ship is
 * simply skipped, so adding Arabic later is a matter of registering the locale
 * and dropping in the translation file, with this table already pointing at
 * it.
 *
 * Countries whose language is genuinely ambiguous are deliberately absent —
 * Switzerland (de/fr/it), Canada (en/fr), Belgium (nl/fr), Luxembourg,
 * Singapore, India, and the United States, where Spanish is as likely a guess
 * as English. Browser language is asked first precisely so those readers are
 * answered by what they told the browser rather than by where they are.
 */
export const COUNTRY_LOCALE_FALLBACK: Record<string, string> = {
  // The site ships one Chinese locale and it is written in Traditional
  // characters. It is still the closest thing we have for a reader in a
  // Chinese-speaking place whose browser language we could not match.
  TW: "zh",
  HK: "zh",
  MO: "zh",
  CN: "zh",

  JP: "ja",
  KR: "ko",

  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  GT: "es",
  CU: "es",
  BO: "es",
  DO: "es",
  HN: "es",
  PY: "es",
  SV: "es",
  NI: "es",
  CR: "es",
  PA: "es",
  UY: "es",
  PR: "es",

  DE: "de",
  AT: "de",
  LI: "de",

  // Not shipped yet. Registering the locale is all these rows are waiting for.
  RU: "ru",
  UA: "uk",
  FR: "fr",
  IR: "fa",
  IL: "he",
  SA: "ar",
  AE: "ar",
  QA: "ar",
  KW: "ar",
  EG: "ar",
  JO: "ar",
};

/**
 * Reduces one language tag to the form this matcher compares, or null if it is
 * not a language tag at all.
 */
const normalizeTag = (tag: string): string | null => {
  // An Accept-Language header carries quality values ("de;q=0.9") where
  // `navigator.languages` never does. Dropping the weight here means either
  // source can be handed straight to the matcher.
  const cleaned = tag.split(";")[0].trim().toLowerCase().replace(/_/g, "-");

  return /^[a-z]{2,3}(-[a-z0-9]+)*$/.test(cleaned) ? cleaned : null;
};

/**
 * The best locale the site ships for one language tag, or null for none.
 *
 * Matching runs from most specific to least, so a tag carrying a region or a
 * script still lands somewhere sensible: `de-AT` and `de-DE` both answer `de`,
 * `zh-Hant-TW` answers `zh`.
 */
export const matchLocale = <T extends string>(
  tag: string | null | undefined,
  supported: readonly T[],
): T | null => {
  const normalized = tag ? normalizeTag(tag) : null;
  if (!normalized) return null;

  const byTag = new Map(
    supported.map((locale) => [locale.toLowerCase(), locale] as const),
  );
  const parts = normalized.split("-");

  // "pt-BR" before "pt": the most specific locale the site actually ships
  // wins, so registering a regional locale later beats the bare language
  // without anything here changing.
  for (let end = parts.length; end > 0; end--) {
    const match = byTag.get(parts.slice(0, end).join("-"));
    if (match) return match;
  }

  // And the other direction — the reader asks for "pt" and the only Portuguese
  // on the site is "pt-BR". Registry order picks the variant, which keeps that
  // list the one place saying which is the default one.
  return (
    supported.find(
      (locale) => locale.toLowerCase().split("-")[0] === parts[0],
    ) ?? null
  );
};

export interface LocaleResolutionInput<T extends string> {
  /**
   * The locale the reader picked by hand on an earlier visit. Only a value
   * that is still in `supportedLocales` is honoured — anything else (a locale
   * that has since been dropped, a hand-edited cookie) is ignored rather than
   * trusted.
   */
  savedPreference?: string | null;
  /** Language tags, most preferred first, as `navigator.languages` orders them. */
  browserLanguages?: readonly string[] | null;
  /** ISO 3166-1 alpha-2 country code from infrastructure we trust. */
  geoCountry?: string | null;
  /** Every locale the site ships, in registry order. */
  supportedLocales: readonly T[];
  /** Where to land when nothing else answers. */
  defaultLocale: T;
}

/**
 * Resolves the locale the site should present, in strict priority order:
 *
 * 1. a locale the reader chose by hand and we saved,
 * 2. their browser's language preferences,
 * 3. the country the request came from,
 * 4. the default.
 *
 * The first rung outranks the rest absolutely. Someone who has picked a
 * language keeps it, and neither a new browser setting nor a trip abroad
 * quietly moves them off it.
 */
export const resolveLocale = <T extends string>({
  savedPreference,
  browserLanguages,
  geoCountry,
  supportedLocales,
  defaultLocale,
}: LocaleResolutionInput<T>): T => {
  const saved = supportedLocales.find((locale) => locale === savedPreference);
  if (saved) return saved;

  for (const tag of browserLanguages ?? []) {
    const match = matchLocale(tag, supportedLocales);
    if (match) return match;
  }

  // Uppercase and length-checked before the lookup: a country code is two
  // letters, and holding to that also means no key from Object's prototype can
  // be reached through this table.
  const country = geoCountry?.trim().toUpperCase() ?? "";
  const fromCountry = /^[A-Z]{2}$/.test(country)
    ? matchLocale(COUNTRY_LOCALE_FALLBACK[country], supportedLocales)
    : null;
  if (fromCountry) return fromCountry;

  return defaultLocale;
};
