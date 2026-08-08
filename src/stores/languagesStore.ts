import { create } from "zustand";

import i18n, {
  INITIAL_LANGUAGE,
  resolveLanguage,
  syncDocumentLanguage,
  type AppLanguage,
} from "@/i18n";
import { saveLocale } from "@/utils/localePreference";

export type { AppLanguage };

interface LanguageState {
  current: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const useLanguagesStore = create<LanguageState>((set) => ({
  // Detection ran once, at import, and this is what it answered. Reading the
  // stored preference again here would be a second path to the same question,
  // free to give a different answer.
  current: INITIAL_LANGUAGE,

  /**
   * Applies a language the reader picked by hand.
   *
   * This is the only thing that writes the preference: a language arrived at
   * automatically stays a guess, so a reader whose browser is German is not
   * held to German for a year on the strength of one visit.
   */
  setLanguage: (lang) => {
    const next = resolveLanguage(lang);
    i18n.changeLanguage(next);
    saveLocale(next);
    syncDocumentLanguage(next);
    set({ current: next });
  },
}));
