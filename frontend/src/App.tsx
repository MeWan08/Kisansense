import { lazy } from "react";
import { Navigate, Route, Routes, Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./components/layout/Layout";
import { storedLocale } from "./lib/i18n";
const Landing = lazy(() => import("./features/landing/LandingPage"));
const Recommend = lazy(() => import("./features/recommend/RecommendPage"));
const Crops = lazy(() => import("./features/crops/CropsPage"));
const Monitoring = lazy(() => import("./features/monitoring/MonitoringPage"));
const Docs = lazy(() => import("./features/docs/DocsPage"));
function NotFound() {
  const { t } = useTranslation();
  const { locale = "en" } = useParams();
  return (
    <div className="error-page">
      <span className="eyebrow">404</span>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundBody")}</p>
      <Link className="button button-primary" to={`/${locale}`}>
        {t("backHome")}
      </Link>
    </div>
  );
}
export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate replace to={`/${storedLocale()}`} />}
      />
      <Route path="/:locale" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="recommend" element={<Recommend />} />
        <Route path="crops" element={<Crops />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="about" element={<Docs />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
