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

function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj == null) continue;
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
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
    if (items.length > 5000) throw new Error("الحد الأقصى 5000 منتج في المرة الواحدة");

    const normalized = items.map((it, idx) => {
      try {
        const n = normalizeItem(it);
        if (data.default_category_id) (n as any).category_id = data.default_category_id;
        return { ok: true, row: n, idx };
      } catch (e: any) {
        return { ok: false, idx, error: e?.message || "خطأ في التطبيع" };
      }
    });

    const valid = normalized.filter((r) => r.ok).map((r: any) => r.row);
    const errors = normalized.filter((r) => !r.ok).map((r: any) => ({ idx: r.idx, error: r.error }));

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
      skipped_invalid: errors.length,
      errors: errors.slice(0, 20),
    };
  });
