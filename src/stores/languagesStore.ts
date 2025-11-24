import { create } from "zustand";
import i18n from "i18next";

export type AppLanguage = "en" | "zh";
const LANGUAGE_KEY = "PREFERRED_LANGUAGE";

interface LanguageState {
  current: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  initLanguage: () => void;
}

export const useLanguagesStore = create<LanguageState>((set) => ({
  current: "en",

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    set({ current: lang });
  },

  initLanguage: () => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null;
    const fallback: AppLanguage = "en";
    const selected = saved ?? fallback;
    i18n.changeLanguage(selected);
    set({ current: selected });
  },
}));
