import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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

export const LANGUAGE_KEY = "PREFERRED_LANGUAGE";

/**
 * localStorage holds whatever an older build — or a hand-edited value — left
 * behind, so every read goes through here rather than being trusted as a code.
 */
export const resolveLanguage = (
  value: string | null | undefined,
): AppLanguage =>
  SUPPORTED_LANGUAGES.some((lang) => lang.code === value)
    ? (value as AppLanguage)
    : DEFAULT_LANGUAGE;

const lng = resolveLanguage(localStorage.getItem(LANGUAGE_KEY));

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
    lng,
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

syncDocumentLanguage(lng);

export default i18n;
