import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n, {
  DEFAULT_LANGUAGE,
  INITIAL_LANGUAGE,
  SUPPORTED_LANGUAGES,
  detectLanguage,
} from "@/i18n";
import { LOCALE_COOKIE, saveLocale } from "@/utils/localePreference";

const codes = SUPPORTED_LANGUAGES.map((lang) => lang.code);

const forgetSavedLocale = () => {
  document.cookie = `${LOCALE_COOKIE}=; Path=/; Max-Age=0`;
  localStorage.clear();
};

const setBrowserLanguages = (languages: string[]) => {
  Object.defineProperty(window.navigator, "languages", {
    value: languages,
    configurable: true,
  });
};

beforeEach(forgetSavedLocale);

afterEach(async () => {
  forgetSavedLocale();
  Reflect.deleteProperty(window.navigator, "languages");
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});

describe("every language the site ships", () => {
  it.each(codes)("initialises and translates in %s", async (code) => {
    await i18n.changeLanguage(code);

    expect(i18n.language).toBe(code);
    // A real string rather than the key echoed back, which is what an
    // unloaded resource bundle would give.
    const translated = i18n.t("menu.language");
    expect(translated).not.toBe("menu.language");
    expect(translated.length).toBeGreaterThan(0);
  });
});

describe("the language the app opens in", () => {
  it("is one the site ships, and the one i18next and the document agree on", () => {
    expect(codes).toContain(INITIAL_LANGUAGE);
    expect(i18n.language).toBe(INITIAL_LANGUAGE);
    expect(document.documentElement.lang).toBe(INITIAL_LANGUAGE);
  });

  it("follows the browser on a first visit", () => {
    setBrowserLanguages(["de-AT", "de"]);

    expect(detectLanguage()).toBe("de");
  });

  it("does not record a browser guess as a choice the reader made", () => {
    setBrowserLanguages(["de-AT", "de"]);

    expect(detectLanguage()).toBe("de");
    // Nothing was written, so the day their browser changes, the site follows
    // it. A guess kept for a year would be indistinguishable from a decision.
    expect(document.cookie).not.toContain(LOCALE_COOKIE);
  });

  it("keeps a language the reader chose, whatever the browser now says", () => {
    saveLocale("ko");
    setBrowserLanguages(["de-DE", "de"]);

    expect(detectLanguage()).toBe("ko");
  });

  it("goes back to detecting once the reader clears the cookie", () => {
    saveLocale("ko");
    setBrowserLanguages(["de-DE", "de"]);
    expect(detectLanguage()).toBe("ko");

    forgetSavedLocale();

    expect(detectLanguage()).toBe("de");
  });

  it.each(["abc", "", "de-DE", "zh-Hant", "undefined", "%%%"])(
    "shrugs off a saved value of %o instead of failing to start",
    (value) => {
      document.cookie = `${LOCALE_COOKIE}=${value}; Path=/`;
      setBrowserLanguages(["ja-JP"]);

      // Unusable, so it is ignored and detection carries on rather than
      // stopping at English — and never throws on the way.
      expect(detectLanguage()).toBe("ja");
    },
  );

  it("lands on English when the browser asks for nothing the site ships", () => {
    setBrowserLanguages(["fr-FR", "th-TH"]);

    expect(detectLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("survives a browser that reports no languages at all", () => {
    setBrowserLanguages([]);

    expect(detectLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("can still be told to open in any language the site ships", () => {
    for (const code of codes) {
      saveLocale(code);
      expect(detectLanguage()).toBe(code);
    }
  });
});
