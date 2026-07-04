import type { SiteSettings } from "./site-settings.functions";

export type PromoBreakItem = {
  id: string;
  product_slug: string;
  badge_ar: string;
  badge_en: string;
  headline_ar: string;
  headline_en: string;
  cta_ar: string;
  cta_en: string;
  price_override: number | null; // null → use product price
  enabled: boolean;
};

const KEY = "promo_breaks_json";

export function parsePromoBreaks(settings?: Partial<SiteSettings> | null): PromoBreakItem[] {
  try {
    const raw = settings?.custom_strings?.[KEY]?.en;
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x === "object")
      .map((x: any) => ({
        id: String(x.id ?? Math.random().toString(36).slice(2)),
        product_slug: String(x.product_slug ?? ""),
        badge_ar: String(x.badge_ar ?? ""),
        badge_en: String(x.badge_en ?? ""),
        headline_ar: String(x.headline_ar ?? ""),
        headline_en: String(x.headline_en ?? ""),
        cta_ar: String(x.cta_ar ?? ""),
        cta_en: String(x.cta_en ?? ""),
        price_override:
          x.price_override === null || x.price_override === undefined || x.price_override === ""
            ? null
            : Number(x.price_override) || null,
        enabled: x.enabled !== false,
      }));
  } catch {
    return [];
  }
}

export function serializePromoBreaks(items: PromoBreakItem[], existing?: SiteSettings["custom_strings"]) {
  const next = { ...(existing || {}) };
  next[KEY] = { en: JSON.stringify(items), ar: "" };
  return next;
}
