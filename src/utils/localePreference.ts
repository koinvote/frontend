/**
 * Where the locale resolver's inputs come from in a browser, and where an
 * explicit choice is kept.
 *
 * Everything here is best-effort and returns nothing rather than throwing.
 * A locale is a presentation detail; no reading of one is allowed to be the
 * reason the site fails to start. Safari with cookies blocked, a sandboxed
 * iframe, private-mode localStorage — each throws on access, and each should
 * cost the reader nothing worse than an English page.
 */

/**
 * First-party preference cookie. It holds one thing — a locale code the reader
 * picked from the language menu — and nothing that could identify them or the
 * browser they picked it in.
 *
 * A cookie rather than localStorage because the preference is eventually the
 * server's business too: the same choice is meant to pick the language of a
 * notification email and of anything rendered before the app boots, and only a
 * cookie reaches the server at all. It is deliberately not HttpOnly — the
 * language menu is what writes it.
 */
export const LOCALE_COOKIE = "koinvote_locale";

/**
 * Where the preference lived before the cookie existed. Read so that anyone
 * who already picked a language keeps it, and still written so that rolling
 * the deploy back does not lose their choice.
 */
export const LEGACY_LANGUAGE_KEY = "PREFERRED_LANGUAGE";

/**
 * The country the request came from, as the edge sees it, published to the
 * page as `<meta name="koinvote-geo-country" content="TW">`.
 *
 * Nothing writes this tag today: neither nginx nor the API knows a country,
 * so this reads as absent and the resolver falls through to English. It is a
 * meta tag rather than a response header or an API call because those cannot
 * be read before the first render — the language has to be settled by then, or
 * the reader watches the page change language under them.
 */
const GEO_COUNTRY_META = "koinvote-geo-country";

const ONE_YEAR_IN_SECONDS = 31536000;

const readCookie = (name: string): string | null => {
  try {
    for (const pair of document.cookie.split(";")) {
      const separator = pair.indexOf("=");
      if (separator < 0) continue;
      // Compared whole, so a `koinvote_locale_v2` sitting alongside it later
      // cannot be mistaken for this one.
      if (pair.slice(0, separator).trim() !== name) continue;
      return pair.slice(separator + 1).trim();
    }
  } catch {
    // Cookies unavailable: no saved preference to speak of.
  }
  return null;
};

/**
 * The cookie string a locale preference is stored as.
 *
 * Split out from the write so both shapes can be asserted on directly: jsdom
 * hands back only the name and value of a cookie it has stored, never the
 * attributes that make this one host-only, long-lived and same-site.
 */
export const localeCookieString = (locale: string, secure: boolean): string =>
  [
    `${LOCALE_COOKIE}=${locale}`,
    "Path=/",
    `Max-Age=${ONE_YEAR_IN_SECONDS}`,
    "SameSite=Lax",
    // No Domain attribute: host-only is what the one site in front of this
    // needs, and widening it to the registrable domain would hand the
    // preference to every other host under it.
    ...(secure ? ["Secure"] : []),
  ].join("; ");

/**
 * Records that the reader chose this locale on purpose.
 *
 * Only ever called from the language menu. A locale worked out from the
 * browser or from a country is a guess, and writing a guess here would make it
 * indistinguishable from a decision — the reader would never get their browser
 * language honoured again after one automatic visit.
 */
export const saveLocale = (locale: string): void => {
  try {
    // Secure would make the cookie unsettable over plain http, which is how
    // `npm run dev` serves localhost. Both deployed sites are https, so the
    // protocol answers this without a build flag having to.
    document.cookie = localeCookieString(
      locale,
      window.location.protocol === "https:",
    );
  } catch {
    // Cookies blocked. The choice still applies to this page, it just will
    // not outlive it.
  }

  try {
    window.localStorage.setItem(LEGACY_LANGUAGE_KEY, locale);
  } catch {
    // Same again, and this one is only the fallback copy.
  }
};

/**
 * The locale the reader last chose by hand, exactly as it was stored.
 *
 * Whether it is a locale the site still ships is the resolver's business —
 * this returns the raw value, including a hand-edited one.
 */
export const readSavedLocale = (): string | null => {
  const fromCookie = readCookie(LOCALE_COOKIE);
  if (fromCookie) return fromCookie;

  try {
    return window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
  } catch {
    return null;
  }
};

/** The reader's language preferences, most preferred first. */
export const readBrowserLanguages = (): readonly string[] => {
  try {
    // `languages` is the whole ordered list and `language` is only the top of
    // it; the second is read as a fallback for browsers that never shipped the
    // first, and iOS Safari has been known to leave the list empty in a web
    // app launched from the home screen.
    const languages = window.navigator.languages;
    if (languages?.length) return languages;

    const language = window.navigator.language;
    return language ? [language] : [];
  } catch {
    return [];
  }
};

/** The country the edge reported, or null when nothing reported one. */
export const readGeoCountry = (): string | null => {
  try {
    const meta = document.querySelector(`meta[name="${GEO_COUNTRY_META}"]`);
    return meta?.getAttribute("content")?.trim() || null;
  } catch {
    return null;
  }
};
