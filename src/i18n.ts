import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locals/en.json";
import zh from "@/locals/zh.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    initImmediate: false
  });

export default i18n;