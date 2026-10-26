import { useState } from "react";
import { NavLink, Link, useParams } from "react-router-dom";
import { Leaf, Menu, Settings2, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ConnectionModal } from "./ConnectionModal";
import { Modal } from "../ui/Modal";
export function Navbar() {
  const { t } = useTranslation();
  const { locale = "en" } = useParams();
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const links = [
    ["recommend", "recommend"],
    ["crops", "crops"],
    ["monitoring", "monitoring"],
    ["about", "docs"],
  ];
  const nav = (mobile = false) => (
    <nav
      aria-label={t("menu")}
      className={mobile ? "mobile-nav" : "desktop-nav"}
    >
      {links.map(([path, key]) => (
        <NavLink
          key={path}
          to={`/${locale}/${path}`}
          onClick={() => setMenu(false)}
        >
          {t(key)}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to={`/${locale}`} aria-label={t("brand")}>
            <span className="brand-mark">
              <Leaf size={22} />
            </span>
            <span>
              Kisan<span className="brand-soft">Sense</span>
              <small>{t("brandTag")}</small>
            </span>
          </Link>
          {nav()}
          <div className="header-controls">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              className="icon-button"
              aria-label={t("settings")}
              onClick={() => setSettings(true)}
            >
              <Settings2 size={19} />
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label={t("menu")}
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <Modal
        open={menu}
        onOpenChange={setMenu}
        title={t("brand")}
        description={t("brandTag")}
        drawer
      >
        {nav(true)}
        <div className="mobile-theme">
          <ThemeToggle />
        </div>
        <Link
          className="button button-primary mt-6"
          onClick={() => setMenu(false)}
          to={`/${locale}/recommend`}
        >
          {t("start")}
          <ArrowUpRight size={18} />
        </Link>
      </Modal>
      {settings && <ConnectionModal open onClose={() => setSettings(false)} />}
    </>
  );
}
