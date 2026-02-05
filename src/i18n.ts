import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locals/en.json";
import zh from "@/locals/zh.json";

const LANGUAGE_KEY = "PREFERRED_LANGUAGE";
const savedLang = localStorage.getItem(LANGUAGE_KEY);
const lng = savedLang === "zh" ? "zh" : "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    initImmediate: false
  });

export default i18n;