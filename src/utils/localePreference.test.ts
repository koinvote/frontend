import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  LEGACY_LANGUAGE_KEY,
  LOCALE_COOKIE,
  localeCookieString,
  readBrowserLanguages,
  readGeoCountry,
  readSavedLocale,
  saveLocale,
} from "./localePreference";

const clearCookies = () => {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0].trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
};

/** Stands in for whatever languages the reader has set in their browser. */
const setBrowserLanguages = (languages: string[] | undefined) => {
  Object.defineProperty(window.navigator, "languages", {
    value: languages,
    configurable: true,
  });
};

beforeEach(() => {
  clearCookies();
  localStorage.clear();
});

afterEach(() => {
  clearCookies();
  localStorage.clear();
  document.querySelector('meta[name="koinvote-geo-country"]')?.remove();
  Reflect.deleteProperty(window.navigator, "languages");
  Reflect.deleteProperty(window.navigator, "language");
});

describe("saving a language the reader picked", () => {
  it("keeps it in a first-party cookie and reads it back", () => {
    saveLocale("de");

    expect(document.cookie).toContain(`${LOCALE_COOKIE}=de`);
    expect(readSavedLocale()).toBe("de");
  });

  it("stores the locale and nothing else", () => {
    saveLocale("ja");

    // The whole point of the cookie is that it says which language this
    // browser prefers and cannot say who is using it.
    const value = document.cookie
      .split(";")
      .map((pair) => pair.trim())
      .find((pair) => pair.startsWith(`${LOCALE_COOKIE}=`));
    expect(value).toBe(`${LOCALE_COOKIE}=ja`);
  });

  it("also writes where the old build looked, so a rollback keeps the choice", () => {
    saveLocale("ko");

    expect(localStorage.getItem(LEGACY_LANGUAGE_KEY)).toBe("ko");
  });

  it("replaces the previous choice rather than stacking another cookie", () => {
    saveLocale("de");
    saveLocale("es");

    expect(readSavedLocale()).toBe("es");
    expect(document.cookie.match(new RegExp(LOCALE_COOKIE, "g"))).toHaveLength(
      1,
    );
  });
});

describe("the attributes the preference cookie is written with", () => {
  // jsdom hands back a cookie's name and value and drops everything else, so
  // the attributes are asserted on the string that is written.
  it("is host-only, site-wide, same-site and long-lived", () => {
    const cookie = localeCookieString("de", false);

    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=31536000");
    // No Domain: the cookie belongs to the host that set it.
    expect(cookie).not.toContain("Domain");
    // Not HttpOnly either — the language menu has to be able to write it.
    expect(cookie).not.toContain("HttpOnly");
  });

  it("is Secure wherever the site is served over https", () => {
    expect(localeCookieString("de", true)).toContain("; Secure");
  });

  it("is not Secure over plain http, which is how the dev server runs", () => {
    expect(localeCookieString("de", false)).not.toContain("Secure");
  });
});

describe("reading back a saved language", () => {
  it("has nothing to say before the reader has chosen", () => {
    expect(readSavedLocale()).toBeNull();
  });

  it("falls back to what an older build stored", () => {
    localStorage.setItem(LEGACY_LANGUAGE_KEY, "ja");

    expect(readSavedLocale()).toBe("ja");
  });

  it("prefers the cookie when both are present", () => {
    localStorage.setItem(LEGACY_LANGUAGE_KEY, "ja");
    saveLocale("de");

    expect(readSavedLocale()).toBe("de");
  });

  it("is not fooled by a cookie whose name merely starts the same", () => {
    document.cookie = `x_${LOCALE_COOKIE}=zh; Path=/`;
    document.cookie = `${LOCALE_COOKIE}_v2=zh; Path=/`;

    expect(readSavedLocale()).toBeNull();
  });

  it("picks its own cookie out from among others", () => {
    document.cookie = "theme=dark; Path=/";
    saveLocale("es");
    document.cookie = "seen_banner=1; Path=/";

    expect(readSavedLocale()).toBe("es");
  });

  it("returns whatever was stored, valid or not", () => {
    // Deciding whether a value is a language the site ships belongs to the
    // resolver, which checks it against the registry.
    document.cookie = `${LOCALE_COOKIE}=abc; Path=/`;

    expect(readSavedLocale()).toBe("abc");
  });
});

describe("reading the browser's languages", () => {
  it("returns them in the reader's own order", () => {
    setBrowserLanguages(["de-DE", "de", "en-US"]);

    expect(readBrowserLanguages()).toEqual(["de-DE", "de", "en-US"]);
  });

  it("falls back to the single language when the list is empty", () => {
    // An iOS home-screen web app has been known to report an empty list.
    setBrowserLanguages([]);
    Object.defineProperty(window.navigator, "language", {
      value: "ja-JP",
      configurable: true,
    });

    expect(readBrowserLanguages()).toEqual(["ja-JP"]);
  });

  it("returns nothing rather than throwing when the browser reports neither", () => {
    setBrowserLanguages(undefined);
    Object.defineProperty(window.navigator, "language", {
      value: undefined,
      configurable: true,
    });

    expect(readBrowserLanguages()).toEqual([]);
  });
});

describe("reading the country the edge reported", () => {
  const setCountryMeta = (content: string) => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "koinvote-geo-country");
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  };

  it("reports nothing when no infrastructure published a country", () => {
    // Which is every deployment today: nothing writes that tag yet.
    expect(readGeoCountry()).toBeNull();
  });

  it("reads the country out of the tag", () => {
    setCountryMeta("TW");

    expect(readGeoCountry()).toBe("TW");
  });

  it("treats an empty tag as no country at all", () => {
    setCountryMeta("   ");

    expect(readGeoCountry()).toBeNull();
  });
});
