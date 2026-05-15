import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import nl from "./locales/nl.json";
import en from "./locales/en.json";
import fa from "./locales/fa.json";

i18n.use(initReactI18next).init({
  resources: { nl: { translation: nl }, en: { translation: en }, fa: { translation: fa } },
  lng: localStorage.getItem("lang") ?? "nl",
  fallbackLng: "nl",
  interpolation: { escapeValue: false },
});

export default i18n;
