import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Wheat, Sprout, Apple, Leaf, ArrowUpRight } from "lucide-react";
import { Input, Button, Badge, Tabs } from "../../components/ui";
import { Modal } from "../../components/ui/Modal";
import { useFormat } from "../../hooks/useFormat";
import { fields } from "../../lib/fields";
import data from "./profiles.json";
type Profile = (typeof data.profiles)[number];
const categories = ["all", "cereal", "pulse", "fruit", "commercial"];
const icons: Record<string, typeof Leaf> = {
  cereal: Wheat,
  pulse: Sprout,
  fruit: Apple,
  commercial: Leaf,
};
export default function CropsPage() {
  const { t } = useTranslation("crops");
  const { t: c } = useTranslation();
  const format = useFormat();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Profile>();
  const filtered = data.profiles.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (t(p.id).toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
        p.id.includes(search.toLowerCase())),
  );
  return (
    <div className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
      </div>
      <div className="library-tools">
        <label className="search-field">
          <Search size={19} />
          <Input
            aria-label={t("search")}
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Tabs
          value={category}
          onChange={setCategory}
          label={t("all")}
          items={categories.map((id) => ({ id, label: t(id) }))}
        />
      </div>
      <div className="library-count" role="status">
        {t("showing", {
          count: filtered.length,
          formattedCount: format.number(filtered.length),
        })}
      </div>
      <div className="crop-grid">
        {filtered.map((p) => {
          const Icon = icons[p.category];
          return (
            <button
              className="crop-card"
              key={p.id}
              onClick={() => setSelected(p)}
            >
              <div className="crop-card-top">
                <span className={`library-icon ${p.category}`}>
                  <Icon size={25} />
                </span>
                <ArrowUpRight size={17} />
              </div>
              <Badge>{t(p.category)}</Badge>
              <h2>{t(p.id)}</h2>
              <dl>
                <div>
                  <dt>{c("temperature")}</dt>
                  <dd>
                    {p.ranges.temperature
                      .map((n) => format.number(n, 1))
                      .join("–")}{" "}
                    {c("celsius")}
                  </dd>
                </div>
                <div>
                  <dt>{c("rainfall")}</dt>
                  <dd>
                    {p.ranges.rainfall.map((n) => format.number(n)).join("–")}{" "}
                    {c("mm")}
                  </dd>
                </div>
                <div>
                  <dt>{c("ph")}</dt>
                  <dd>
                    {p.ranges.ph.map((n) => format.number(n, 1)).join("–")}
                  </dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={32} />
          <h2>{t("noResults")}</h2>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            {t("clear")}
          </Button>
        </div>
      )}
      <p className="library-note">{t("rangeNote")}</p>
      {selected && (
        <Modal
          open
          onOpenChange={(v) => !v && setSelected(undefined)}
          title={t(selected.id)}
          description={t("samples", {
            count: selected.count,
            formattedCount: format.number(selected.count),
          })}
        >
          <p className="section-label mt-6">{t("profile")}</p>
          <dl className="profile-list">
            {fields.map((f) => (
              <div key={f.key}>
                <dt>{c(f.key)}</dt>
                <dd>
                  {selected.ranges[f.key]
                    .map((n) => format.number(n, 1))
                    .join(" – ")}{" "}
                  {c(f.unit)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-sm muted mt-6">{t("rangeNote")}</p>
        </Modal>
      )}
    </div>
  );
}
