import { motion, useReducedMotion } from "framer-motion";
import { motionTiming } from "../../lib/motion";
import { useEffect, Suspense } from "react";
import { Outlet, Navigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FlaskConical } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Seo } from "./Seo";
import { Skeleton, ChatWidget } from "../ui";
import { isLocale } from "../../lib/i18n";
import { writeStorage } from "../../lib/storage";
import { useWorkspace } from "../../hooks/useWorkspace";
export function Layout() {
  const { locale } = useParams();
  const reduced = useReducedMotion();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const { connection } = useWorkspace();
  useEffect(() => {
    if (isLocale(locale)) {
      void i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
      writeStorage("ks-locale", locale);
    }
  }, [locale, i18n]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  if (!isLocale(locale)) return <Navigate replace to="/en/not-found" />;
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <Seo />
      <Navbar />
      {connection.mock && (
        <div className="demo-banner">
          <FlaskConical size={17} />
          {t("demoNotice")}
        </div>
      )}
      <main id="main" className="page-container" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="page-loading">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          }
        >
          <motion.div
            key={pathname.split("/").slice(2).join("/")}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={motionTiming}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
