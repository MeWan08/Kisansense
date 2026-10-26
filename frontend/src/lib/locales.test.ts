import { it, expect } from "vitest";
import i18n, { locales } from "./i18n";
import { cropIds } from "./api/schemas";
import { presets, readingSchema } from "./fields";
import data from "../features/crops/profiles.json";
it("provides complete namespaces and crop names in every locale", () => {
  for (const namespace of [
    "common",
    "landing",
    "recommend",
    "crops",
    "monitoring",
    "docs",
  ]) {
    const reference = Object.keys(
      i18n.getResourceBundle("en", namespace),
    ).sort();
    for (const locale of locales) {
      const translations = i18n.getResourceBundle(locale, namespace) as Record<
        string,
        string
      >;
      expect(Object.keys(translations).sort()).toEqual(reference);
      expect(
        Object.values(translations).every((v) => v.trim().length > 0),
      ).toBe(true);
    }
  }
  for (const locale of locales)
    for (const crop of cropIds)
      expect(i18n.exists(crop, { lng: locale, ns: "crops" })).toBe(true);
});
it("ships complete reference data and valid presets", () => {
  expect(data.profiles.map((p) => p.id).sort()).toEqual([...cropIds].sort());
  for (const p of presets)
    expect(readingSchema.safeParse(p.values).success).toBe(true);
});
