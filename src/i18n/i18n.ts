import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ru from "./locales/ru.json";
import ua from "./locales/ua.json";
import pl from "./locales/pl.json";
import es from "./locales/es.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", name: "English", flag: "🇬🇧" },
  { code: "ru", label: "RU", name: "Русский", flag: "🇷🇺" },
  { code: "ua", label: "UA", name: "Українська", flag: "🇺🇦" },
  { code: "pl", label: "PL", name: "Polski", flag: "🇵🇱" },
  { code: "es", label: "ES", name: "Español", flag: "🇪🇸" },
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ru: { translation: ru }, ua: { translation: ua }, pl: { translation: pl }, es: { translation: es } },
    fallbackLng: "en",
    supportedLngs: ["en", "ru", "ua", "pl", "es"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18n_lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
