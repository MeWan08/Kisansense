import { useTranslation } from "react-i18next";
export function useFormat() {
  const { i18n } = useTranslation();
  const locale = `${i18n.language}-IN`;
  return {
    number: (value: number, digits = 0) =>
      new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(
        value,
      ),
    percent: (value: number) =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(value),
    time: (value: number) =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(value),
  };
}
