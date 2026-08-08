import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resolveLocale } from "@/utils/locale";
import {
  readBrowserLanguages,
  readGeoCountry,
  readSavedLocale,
} from "@/utils/localePreference";

import en from "@/locals/en.json";
import ja from "@/locals/ja.json";
import de from "@/locals/de.json";
import es from "@/locals/es.json";
import ko from "@/locals/ko.json";
import zh from "@/locals/zh.json";

/**
 * Every language the site offers, in the order the switcher lists them.
 *
 * `name` is written in the language itself and never translated: someone who
 * lands on a language they cannot read still recognises their own entry and
 * can get back out. Adding a seventh language means adding its JSON file, one
 * entry here, and nothing else — the switcher renders whatever is in here.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);

/**
 * A stored value is whatever an older build — or a hand-edited cookie — left
 * behind, so every read goes through here rather than being trusted as a code.
 */
export const resolveLanguage = (
  value: string | null | undefined,
): AppLanguage =>
  SUPPORTED_LANGUAGES.some((lang) => lang.code === value)
    ? (value as AppLanguage)
    : DEFAULT_LANGUAGE;

/**
 * Works out the language to open the site in: the one the reader chose on an
 * earlier visit, else the best match for their browser's languages, else the
 * country they are in, else English. `@/utils/locale` holds the rules; this
 * hands it the registry above and the browser's answers.
 *
 * Called once at import, before React renders, so the first paint is already
 * in the right language rather than switching out from under the reader.
 */
export const detectLanguage = (): AppLanguage => {
  try {
    return resolveLocale({
      savedPreference: readSavedLocale(),
      browserLanguages: readBrowserLanguages(),
      geoCountry: readGeoCountry(),
      supportedLocales: SUPPORTED_CODES,
      defaultLocale: DEFAULT_LANGUAGE,
    });
  } catch {
    // Whatever went wrong reading a preference, an unreadable one is not a
    // reason for the site not to load.
    return DEFAULT_LANGUAGE;
  }
};

/**
 * The language the app started in. The store reads this rather than detecting
 * again, so there is one answer per page load and one path that produced it.
 */
export const INITIAL_LANGUAGE = detectLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja },
      ko: { translation: ko },
      es: { translation: es },
      de: { translation: de }
    },
    lng: INITIAL_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    initImmediate: false
  });

/**
 * Keeps `<html lang>` in step with the site language. Screen readers pick the
 * voice from it, and Safari offers its translate prompt off the same
 * attribute — index.html can only ever hard-code one value.
 */
export const syncDocumentLanguage = (lang: AppLanguage) => {
  document.documentElement.lang = lang;
};

syncDocumentLanguage(INITIAL_LANGUAGE);

export default i18n;
