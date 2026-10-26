import i18n from "i18next";
import { initReactI18next } from "react-i18next";
export const locales = ["en", "hi", "mr"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (value?: string): value is Locale =>
  locales.includes(value as Locale);
export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};
export function storedLocale(): Locale {
  try {
    const value = localStorage.getItem("ks-locale");
    return isLocale(value ?? undefined) ? (value as Locale) : "en";
  } catch {
    return "en";
  }
}
const modules = import.meta.glob<{ default: Record<string, string> }>(
  "../locales/*/*.json",
  { eager: true },
);
const resources: Record<string, Record<string, Record<string, string>>> = {};
for (const [path, module] of Object.entries(modules)) {
  const [, locale, ns] = path.match(/locales\/(\w+)\/(\w+)\.json$/) ?? [];
  if (locale && ns) (resources[locale] ??= {})[ns] = module.default;
}
void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLocale(),
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
export default i18n;
