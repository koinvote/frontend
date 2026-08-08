import { create } from "zustand";

import i18n, {
  LANGUAGE_KEY,
  resolveLanguage,
  syncDocumentLanguage,
  type AppLanguage,
} from "@/i18n";

export type { AppLanguage };

interface LanguageState {
  current: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  initLanguage: () => void;
}

export const useLanguagesStore = create<LanguageState>((set) => ({
  current: resolveLanguage(localStorage.getItem(LANGUAGE_KEY)),

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    syncDocumentLanguage(lang);
    set({ current: lang });
  },

  initLanguage: () => {
    const selected = resolveLanguage(localStorage.getItem(LANGUAGE_KEY));
    i18n.changeLanguage(selected);
    syncDocumentLanguage(selected);
    set({ current: selected });
  },
}));
