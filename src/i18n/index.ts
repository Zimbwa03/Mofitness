import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import en from "./en.json";
import sn from "./sn.json";

const locale = getLocales()[0]?.languageCode ?? "en";
const fallbackLng = locale === "sn" ? "sn" : "en";

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: fallbackLng,
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    sn: { translation: sn },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
