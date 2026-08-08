import { describe, expect, it } from "vitest";

import { SUPPORTED_LANGUAGES } from "@/i18n";
import {
  COUNTRY_LOCALE_FALLBACK,
  matchLocale,
  resolveLocale,
  type LocaleResolutionInput,
} from "./locale";

// The languages the site actually ships, taken from the registry rather than
// listed again: a locale added there is a locale these tests cover.
const supported = SUPPORTED_LANGUAGES.map((lang) => lang.code);
type Locale = (typeof supported)[number];

const resolve = (
  input: Omit<
    LocaleResolutionInput<Locale>,
    "supportedLocales" | "defaultLocale"
  >,
) =>
  resolveLocale({
    ...input,
    supportedLocales: supported,
    defaultLocale: "en",
  });

describe("resolving which language to present", () => {
  it("keeps a language the reader chose over the one their browser asks for", () => {
    expect(
      resolve({ savedPreference: "ko", browserLanguages: ["de-DE", "de"] }),
    ).toBe("ko");
  });

  it("keeps a language the reader chose over the country they are in", () => {
    expect(resolve({ savedPreference: "ko", geoCountry: "DE" })).toBe("ko");
  });

  it("keeps a language the reader chose over both at once", () => {
    expect(
      resolve({
        savedPreference: "ja",
        browserLanguages: ["es-MX", "es"],
        geoCountry: "MX",
      }),
    ).toBe("ja");
  });

  it("asks the browser before it asks where the reader is", () => {
    // Someone in Germany reading Spanish is reading Spanish. The browser is
    // the reader speaking; the country is a guess about them.
    expect(
      resolve({ browserLanguages: ["es-ES"], geoCountry: "DE" }),
    ).toBe("es");
  });

  it("falls back to English when it has nothing to go on", () => {
    expect(resolve({})).toBe("en");
    expect(resolve({ browserLanguages: [], geoCountry: null })).toBe("en");
  });
});

describe("matching a browser's language tag", () => {
  it.each([
    ["de-DE", "de"],
    ["de-AT", "de"],
    ["de-CH", "de"],
    ["es-MX", "es"],
    ["es-AR", "es"],
    ["es-ES", "es"],
    ["ko-KR", "ko"],
    ["ja-JP", "ja"],
    ["zh-TW", "zh"],
    ["zh-Hant", "zh"],
    ["zh-Hant-TW", "zh"],
    ["en-GB", "en"],
  ])("answers %s with %s", (tag, expected) => {
    expect(resolve({ browserLanguages: [tag] })).toBe(expected);
  });

  it("reads the list in the order the reader put it in", () => {
    expect(resolve({ browserLanguages: ["ja-JP", "en-US"] })).toBe("ja");
    expect(resolve({ browserLanguages: ["en-US", "ja-JP"] })).toBe("en");
  });

  it("walks past languages the site does not ship", () => {
    // Their first choice is not on offer; their second is, and it beats both
    // the country and English.
    expect(
      resolve({ browserLanguages: ["fr-FR", "nl", "de-DE"], geoCountry: "TW" }),
    ).toBe("de");
  });

  it("falls through when it ships none of them", () => {
    expect(resolve({ browserLanguages: ["fr-FR", "th", "vi"] })).toBe("en");
  });

  it.each(["", "   ", "*", "!!", "en_", "-", "toolongtobealanguage"])(
    "ignores %o rather than guessing at it",
    (tag) => {
      expect(matchLocale(tag, supported)).toBeNull();
    },
  );

  it("accepts the shapes either source of languages can arrive in", () => {
    // An Accept-Language header weights its entries and some platforms write
    // the separator as an underscore; navigator.languages does neither.
    expect(matchLocale("de;q=0.9", supported)).toBe("de");
    expect(matchLocale("es_MX", supported)).toBe("es");
    expect(matchLocale("JA-JP", supported)).toBe("ja");
  });

  it("prefers the most specific locale on offer, and settles for the least", () => {
    // Neither case exists in the registry today. Both are what future-proofing
    // means here: registering pt-BR is meant to be the whole job.
    const withRegional = ["en", "pt-BR"] as const;
    expect(matchLocale("pt-BR", withRegional)).toBe("pt-BR");
    expect(matchLocale("pt-PT", withRegional)).toBe("pt-BR");
    expect(matchLocale("pt", withRegional)).toBe("pt-BR");
  });
});

describe("falling back to the country the request came from", () => {
  it.each([
    ["TW", "zh"],
    ["JP", "ja"],
    ["KR", "ko"],
    ["ES", "es"],
    ["MX", "es"],
    ["AR", "es"],
    ["DE", "de"],
    ["AT", "de"],
  ])("answers %s with %s when the browser asked for nothing we have", (country, expected) => {
    expect(resolve({ browserLanguages: ["fr-FR"], geoCountry: country })).toBe(
      expected,
    );
  });

  it("is case- and whitespace-insensitive about the country", () => {
    expect(resolve({ geoCountry: " jp " })).toBe("ja");
  });

  it("answers English for a country it has no row for", () => {
    expect(resolve({ geoCountry: "NG" })).toBe("en");
  });

  it("answers English for a country whose language the site does not ship yet", () => {
    // The table already points EG at Arabic. Until Arabic is registered that
    // row resolves to nothing, and registering it is all that will change.
    expect(COUNTRY_LOCALE_FALLBACK.EG).toBe("ar");
    expect(resolve({ geoCountry: "EG" })).toBe("en");
  });

  it.each(["", "T", "TWN", "__proto__", "constructor", "toString"])(
    "answers English for %o rather than treating it as a country",
    (country) => {
      expect(resolve({ geoCountry: country })).toBe("en");
    },
  );

  it("leaves countries that speak more than one language to the browser", () => {
    // Canada, Switzerland, Belgium, the United States: guessing from the
    // country here would be guessing against the reader as often as with them.
    for (const country of ["CA", "CH", "BE", "US", "SG", "IN", "LU"]) {
      expect(COUNTRY_LOCALE_FALLBACK[country]).toBeUndefined();
    }
  });
});

describe("a saved preference that no longer makes sense", () => {
  it.each(["abc", "", "   ", "de-DE", "EN", "en-US", "null", "[object Object]"])(
    "ignores %o and carries on detecting",
    (saved) => {
      // Only a code the registry still carries counts. Anything else — hand
      // edited, left by a build that shipped other locales — is treated as no
      // preference at all rather than as a reason to show English.
      expect(
        resolve({ savedPreference: saved, browserLanguages: ["ja-JP"] }),
      ).toBe("ja");
    },
  );

  it("still lands on English when there is nothing else to go on", () => {
    expect(resolve({ savedPreference: "abc" })).toBe("en");
  });

  it("honours every locale the site ships", () => {
    for (const locale of supported) {
      expect(
        resolve({ savedPreference: locale, browserLanguages: ["fr-FR"] }),
      ).toBe(locale);
    }
  });
});

describe("the country table", () => {
  it("is keyed by two-letter country codes", () => {
    for (const country of Object.keys(COUNTRY_LOCALE_FALLBACK)) {
      expect(country).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("holds language tags, whether or not they are shipped yet", () => {
    for (const locale of Object.values(COUNTRY_LOCALE_FALLBACK)) {
      expect(locale).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/);
    }
  });
});
