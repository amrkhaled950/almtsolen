import type { SiteSettings } from "./site-settings.functions";

export type HomeSection = {
  id: string;
  title_ar: string;
  title_en: string;
  category_slug: string; // empty = use special source
  source: "category" | "bestsellers" | "new_arrivals" | "featured";
  limit: number;
  enabled: boolean;
};

const KEY = "home_sections_json";

export function parseHomeSections(settings?: Partial<SiteSettings> | null): HomeSection[] {
  try {
    const raw = settings?.custom_strings?.[KEY]?.en;
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x === "object")
      .map((x: any) => ({
        id: String(x.id ?? Math.random().toString(36).slice(2)),
        title_ar: String(x.title_ar ?? ""),
        title_en: String(x.title_en ?? ""),
        category_slug: String(x.category_slug ?? ""),
        source: (["category", "bestsellers", "new_arrivals", "featured"].includes(x.source) ? x.source : "category") as HomeSection["source"],
        limit: Math.max(2, Math.min(24, Number(x.limit) || 8)),
        enabled: x.enabled !== false,
      }));
  } catch {
    return [];
  }
}

export function serializeHomeSections(sections: HomeSection[], existing?: SiteSettings["custom_strings"]) {
  const next = { ...(existing || {}) };
  next[KEY] = { en: JSON.stringify(sections), ar: "" };
  return next;
}
