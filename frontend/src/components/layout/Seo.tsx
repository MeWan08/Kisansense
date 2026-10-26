import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { locales } from "../../lib/i18n";
export function Seo() {
  const { locale = "en" } = useParams();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  useEffect(() => {
    const key = pathname.split("/")[2];
    const title = t(
      (
        {
          about: "docs",
          recommend: "recommend",
          crops: "crops",
          monitoring: "monitoring",
        } as Record<string, string>
      )[key] ?? "home",
    );
    document.title = `${title} · KisanSense`;
    const description = t("seoDescription");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
    const origin = (
      import.meta.env.VITE_SITE_URL || window.location.origin
    ).replace(/\/$/, "");
    const route = pathname.slice(locale.length + 1);
    const nodes: HTMLElement[] = [];
    for (const lang of [...locales, "x-default"]) {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = lang;
      link.href = `${origin}/${lang === "x-default" ? "en" : lang}${route}`;
      document.head.append(link);
      nodes.push(link);
    }
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = origin + pathname;
    document.head.append(canonical);
    nodes.push(canonical);
    return () => nodes.forEach((n) => n.remove());
  }, [pathname, locale, t]);
  return null;
}
