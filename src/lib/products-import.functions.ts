import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

// Accept either an array or { products: [...] } / { data: [...] }
const importSchema = z.object({
  payload: z.any(),
  default_category_id: z.string().uuid().optional().nullable(),
  upsert: z.boolean().optional().default(true),
});

function slugify(input: string): string {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, "") // strip arabic for slug
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || `item-${Math.random().toString(36).slice(2, 8)}`;
}

function categorySlug(input: string): string {
  const s = (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-]+/gu, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return s || `cat-${Math.random().toString(36).slice(2, 8)}`;
}

function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj == null) continue;
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

const GENERIC_CATEGORY_RE = /^(all|كل\s*ال?كتب|كل\s*الكتب|الكل)$/i;

function normalizeCategoryKey(input: string): string {
  return String(input || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function categoryValueToName(value: any): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && !/^[0-9a-f-]{30,}$/i.test(trimmed) ? trimmed : null;
  }
  if (value && typeof value === "object") {
    const name = value.name || value.name_ar || value.name_en || value.title || value.label || value.slug;
    return typeof name === "string" && name.trim() ? name.trim() : null;
  }
  return null;
}

function extractCategoryNames(item: any): string[] {
  const names: string[] = [];
  const direct = pick(item, [
    "category",
    "category_name",
    "category_ar",
    "category_en",
    "categoryName",
    "cat",
    "section",
  ]);
  const add = (value: any) => {
    if (Array.isArray(value)) value.forEach(add);
    else {
      const name = categoryValueToName(value);
      if (name) names.push(name);
    }
  };

  add(direct);
  add(pick(item, ["categories", "parsed_categories", "category_list"]));

  const seen = new Set<string>();
  return names.filter((name) => {
    const key = normalizeCategoryKey(name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toNumber(v: any, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function toInt(v: any, fallback = 0): number {
  return Math.max(0, Math.floor(toNumber(v, fallback)));
}

function firstImage(item: any): string | null {
  const direct = pick(item, ["cover_url", "cover", "image", "image_url", "thumbnail", "thumb", "photo", "main_image"]);
  if (typeof direct === "string") return direct;
  const arr = pick(item, ["images", "photos", "gallery", "media"]);
  if (Array.isArray(arr) && arr.length) {
    const first = arr[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      return first.url || first.src || first.image || first.path || null;
    }
  }
  return null;
}

function stripHtml(s: any): string {
  if (s == null) return "";
  return String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function normalizeItem(item: any) {
  const title_ar =
    pick(item, ["title_ar", "name_ar", "arabic_name", "title", "name"]) || "بدون عنوان";
  const title_en =
    pick(item, ["title_en", "name_en", "english_name"]) || String(title_ar);
  const author_ar = pick(item, ["author_ar", "author", "writer", "writer_ar"]) || "—";
  const author_en = pick(item, ["author_en", "author"]) || String(author_ar);
  const description = stripHtml(pick(item, ["description", "description_ar", "details", "body", "content"]) || "");
  const slug =
    pick(item, ["slug", "handle", "permalink", "url_slug"]) ||
    slugify(pick(item, ["sku", "code", "id"]) ? String(pick(item, ["sku", "code", "id"])) : String(title_en));
  const price = toNumber(pick(item, ["price", "selling_price", "sale_price", "unit_price"]));
  const compare = pick(item, ["compare_at_price", "old_price", "original_price", "list_price"]);
  const category_names = extractCategoryNames(item);
  return {
    slug: String(slug).slice(0, 120),
    title_ar: String(title_ar).slice(0, 200),
    title_en: String(title_en).slice(0, 200),
    author_ar: String(author_ar).slice(0, 120),
    author_en: String(author_en).slice(0, 120),
    publisher_ar: pick(item, ["publisher_ar", "publisher", "brand"]) ?? null,
    publisher_en: pick(item, ["publisher_en", "publisher", "brand"]) ?? null,
    description_ar: String(description).slice(0, 4000) || null,
    description_en: String(pick(item, ["description_en"]) || description).slice(0, 4000) || null,
    price,
    compare_at_price: compare != null ? toNumber(compare) : null,
    cost_price: toNumber(pick(item, ["cost_price", "cost", "buying_price", "wholesale_price"])),
    marketing_cost: toNumber(pick(item, ["marketing_cost", "marketing", "ads_cost"])),
    misc_expenses: toNumber(pick(item, ["misc_expenses", "expenses", "other_cost"])),
    cover_url: firstImage(item),
    pages: toInt(pick(item, ["pages", "page_count", "num_pages"]), 0) || null,
    isbn: pick(item, ["isbn", "isbn_13", "barcode", "sku", "ean"]) ?? null,
    stock: toInt(pick(item, ["stock", "quantity", "qty", "inventory", "stock_quantity"]), 0),
    is_active: pick(item, ["is_active", "active", "available", "is_available"]) !== false,
    _category_names: category_names,
  };
}

export const importProductsJson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => importSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let raw = data.payload;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        throw new Error("الملف ليس JSON صحيح");
      }
    }
    let items: any[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (Array.isArray(raw?.products)) items = raw.products;
    else if (Array.isArray(raw?.data)) items = raw.data;
    else if (Array.isArray(raw?.items)) items = raw.items;
    else throw new Error("بنية JSON غير مدعومة - يجب أن تكون مصفوفة منتجات");

    if (items.length === 0) throw new Error("الملف فارغ");
    if (items.length > 20000) throw new Error("الحد الأقصى 20000 منتج في المرة الواحدة");

    const normalized = items.map((it, idx) => {
      try {
        const n = normalizeItem(it);
        return { ok: true, row: n, idx };
      } catch (e: any) {
        return { ok: false, idx, error: e?.message || "خطأ في التطبيع" };
      }
    });

    const valid = normalized.filter((r) => r.ok).map((r: any) => r.row);
    const errors = normalized.filter((r) => !r.ok).map((r: any) => ({ idx: r.idx, error: r.error }));

    // Resolve / create every category found in JSON, then use the first non-generic one as product.category_id
    const categoryNameByKey = new Map<string, string>();
    for (const row of valid as any[]) {
      for (const name of row._category_names ?? []) {
        const key = normalizeCategoryKey(name);
        if (key && !categoryNameByKey.has(key)) categoryNameByKey.set(key, name);
      }
    }
    const uniqueCatNames = Array.from(categoryNameByKey.values());
    const nameToCatId = new Map<string, string>();
    let categories_created = 0;
    if (uniqueCatNames.length) {
      const wantedSlugs = uniqueCatNames.map((n) => ({ name: n, slug: categorySlug(n) }));
      const { data: existing, error: catFetchErr } = await supabaseAdmin
        .from("categories")
        .select("id, slug, name_ar, name_en");
      if (catFetchErr) throw new Error(`فشل جلب التصنيفات: ${catFetchErr.message}`);
      const bySlug = new Map<string, string>();
      const byName = new Map<string, string>();
      for (const c of existing ?? []) {
        bySlug.set(c.slug, c.id);
        if (c.name_ar) byName.set(normalizeCategoryKey(c.name_ar), c.id);
        if (c.name_en) byName.set(normalizeCategoryKey(c.name_en), c.id);
      }
      const toCreate: any[] = [];
      for (const { name, slug } of wantedSlugs) {
        const found = byName.get(normalizeCategoryKey(name)) || bySlug.get(slug);
        if (found) {
          nameToCatId.set(normalizeCategoryKey(name), found);
        } else {
          toCreate.push({
            slug,
            name_ar: name,
            name_en: name,
            display_order: 0,
            is_active: true,
            show_in_nav: true,
            nav_order: 0,
          });
        }
      }
      if (toCreate.length) {
        const { data: created, error: catCreateErr } = await supabaseAdmin
          .from("categories")
          .upsert(toCreate, { onConflict: "slug" })
          .select("id, slug, name_ar");
        if (catCreateErr) throw new Error(`فشل إنشاء التصنيفات: ${catCreateErr.message}`);
        for (const c of created ?? []) {
          if (c.name_ar) nameToCatId.set(normalizeCategoryKey(c.name_ar), c.id);
        }
        categories_created = toCreate.length;
      }
    }

    // Assign category_id to each row
    let categorized = 0;
    for (const row of valid as any[]) {
      const names = (row._category_names ?? []) as string[];
      delete row._category_names;
      const catName = names.find((name) => !GENERIC_CATEGORY_RE.test(name.trim())) || names[0];
      const catId = catName ? nameToCatId.get(normalizeCategoryKey(catName)) : null;
      if (catId) {
        row.category_id = catId;
        categorized += 1;
      } else if (data.default_category_id) {
        row.category_id = data.default_category_id;
        categorized += 1;
      }
    }

    // De-duplicate by slug (last wins)
    const bySlug = new Map<string, any>();
    for (const row of valid) {
      let base = row.slug;
      let candidate = base;
      let n = 1;
      while (bySlug.has(candidate)) {
        n += 1;
        candidate = `${base}-${n}`;
      }
      row.slug = candidate;
      bySlug.set(candidate, row);
    }
    const rows = Array.from(bySlug.values());

    // Chunked upsert
    const CHUNK = 200;
    let inserted = 0;
    let updated = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      if (data.upsert) {
        const { error, count } = await supabaseAdmin
          .from("products")
          .upsert(slice, { onConflict: "slug", count: "exact" });
        if (error) throw new Error(`فشل عند الدفعة ${i / CHUNK + 1}: ${error.message}`);
        updated += count ?? 0;
      } else {
        const { error } = await supabaseAdmin.from("products").insert(slice);
        if (error) throw new Error(`فشل عند الدفعة ${i / CHUNK + 1}: ${error.message}`);
        inserted += slice.length;
      }
    }

    return {
      ok: true,
      total: items.length,
      processed: rows.length,
      inserted: data.upsert ? updated : inserted,
      categories_created,
      categorized,
      skipped_invalid: errors.length,
      errors: errors.slice(0, 20),
    };
  });
