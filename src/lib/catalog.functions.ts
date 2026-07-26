import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type UIProduct = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  publisher_ar: string | null;
  publisher_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  compare_at_price: number | null;
  cover_url: string | null;
  category_id: string | null;
  pages: number | null;
  isbn: string | null;
  rating: number;
  reviews_count: number;
  stock: number;
  unlimited_stock: boolean;
  is_active: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_featured: boolean;
};

export type UICategory = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
};

const PRODUCT_COLS =
  "id, slug, title_ar, title_en, author_ar, author_en, publisher_ar, publisher_en, description_ar, description_en, price, compare_at_price, cover_url, category_id, pages, isbn, rating, reviews_count, stock, unlimited_stock, is_active, is_bestseller, is_new_arrival, is_featured, display_order, created_at";



// Public (anon) credentials — safe to hardcode as fallback so the catalog
// works on any host even when server env vars are not configured.
const FALLBACK_SUPABASE_URL = "https://hiaewjagcvycyuxweiwj.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYWV3amFnY3Z5Y3l1eHdlaXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzOTMzODcsImV4cCI6MjA5NTk2OTM4N30.EMCWia7PoTDUhCljG2Oa8YBuQPnbuyC80E0Ss_iDA6Y";

function getPublicClient() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    FALLBACK_SUPABASE_URL;
  let key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  // Guard against sb_secret_* / service-role keys being injected here —
  // PostgREST rejects non-JWT keys with "Invalid API key".
  if (!key.startsWith("eyJ")) {
    key = FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  }
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listCategoriesPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ categories: UICategory[] }> => {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, name_ar, name_en, description_ar, description_en, image_url, display_order, is_active",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { categories: (data ?? []) as UICategory[] };
  },
);

export const listProductsPublic = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        category_slug: z.string().optional(),
        featured: z.boolean().optional(),
        bestseller: z.boolean().optional(),
        new_arrival: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ products: UIProduct[] }> => {
    const supabase = getPublicClient();
    let categoryId: string | null = null;
    let categoryProductIds: string[] | null = null;
    if (data.category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category_slug)
        .maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) return { products: [] };
      try {
        const { data: links } = await supabase
          .from("product_categories" as any)
          .select("product_id")
          .eq("category_id", categoryId);
        categoryProductIds = Array.from(new Set((links ?? []).map((l: any) => l.product_id)));
      } catch {
        categoryProductIds = null;
      }
    }
    const buildQuery = () => {
      let q = supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("is_active", true);
      if (data.featured) q = q.eq("is_featured", true);
      if (data.bestseller) q = q.eq("is_bestseller", true);
      if (data.new_arrival) q = q.eq("is_new_arrival", true);
      return q;
    };

    // Fetch products for a category by combining direct category_id matches
    // and junction-table matches in-memory (avoids URI-too-long errors when
    // a category has many linked products).
    const fetchByCategory = async (limit?: number): Promise<UIProduct[]> => {
      const seen = new Set<string>();
      const out: UIProduct[] = [];
      const pushRows = (rows: UIProduct[] | null) => {
        for (const r of rows ?? []) {
          if (seen.has(r.id)) continue;
          seen.add(r.id);
          out.push(r);
        }
      };
      // Direct category_id
      {
        let q = buildQuery()
          .eq("category_id", categoryId!)
          .order("display_order" as any, { ascending: true })
          .order("created_at", { ascending: false });
        const { data: rows, error } = await q;
        if (error) throw new Error(error.message);
        pushRows(rows as UIProduct[]);
      }
      // Junction — chunk IDs to keep URLs short
      const ids = categoryProductIds ?? [];
      const CHUNK = 50;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const slice = ids.slice(i, i + CHUNK);
        let q = buildQuery()
          .in("id", slice)
          .order("display_order" as any, { ascending: true })
          .order("created_at", { ascending: false });
        const { data: rows, error } = await q;
        if (error) throw new Error(error.message);
        pushRows(rows as UIProduct[]);
      }
      // Merge-sort by display_order (asc), then created_at (desc)
      out.sort((a: any, b: any) => {
        const da = Number(a.display_order ?? 0);
        const db = Number(b.display_order ?? 0);
        if (da !== db) return da - db;
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      return limit ? out.slice(0, limit) : out;
    };

    if (categoryId) {
      const rows = await fetchByCategory(data.limit);
      return { products: rows };
    }

    if (data.limit) {
      const { data: rows, error } = await buildQuery()
        .order("display_order" as any, { ascending: true })
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (error) throw new Error(error.message);
      return { products: (rows ?? []) as UIProduct[] };
    }


    // Keyset pagination by id to bypass PostgREST db-max-rows cap on range/offset.
    const PAGE = 500;
    const all: UIProduct[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 50; i++) {
      let q = buildQuery().order("id", { ascending: true }).limit(PAGE);
      if (cursor) q = q.gt("id", cursor);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      if (!rows?.length) break;
      all.push(...(rows as UIProduct[]));
      if (rows.length < PAGE) break;
      cursor = (rows[rows.length - 1] as UIProduct).id;
    }
    return { products: all };
  });


export const getProductPublic = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }): Promise<{ product: UIProduct | null }> => {
    const supabase = getPublicClient();
    const { data: row, error } = await supabase
      .from("products")
      .select(
        PRODUCT_COLS,
      )
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { product: (row as UIProduct | null) ?? null };
  });

function escapeIlike(s: string) {
  return s.replace(/[\\%_,()]/g, (m) => "\\" + m);
}

export const searchProductsPublic = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        q: z.string().trim().max(200).optional(),
        category_slug: z.string().max(120).optional(),
        min_price: z.number().nonnegative().optional(),
        max_price: z.number().nonnegative().optional(),
        min_rating: z.number().min(0).max(5).optional(),
        in_stock: z.boolean().optional(),
        sort: z.enum(["relevance", "new", "price-asc", "price-desc", "rating"]).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<{ products: UIProduct[]; total: number }> => {
    const supabase = getPublicClient();

    let categoryId: string | null = null;
    let categoryProductIds: string[] | null = null;
    if (data.category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category_slug)
        .maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) return { products: [], total: 0 };
      try {
        const { data: links } = await supabase
          .from("product_categories" as any)
          .select("product_id")
          .eq("category_id", categoryId);
        categoryProductIds = Array.from(new Set((links ?? []).map((l: any) => l.product_id)));
      } catch {
        categoryProductIds = null;
      }
    }

    let q = supabase
      .from("products")
      .select(PRODUCT_COLS, { count: "exact" })
      .eq("is_active", true);

    if (data.q) {
      const term = `%${escapeIlike(data.q)}%`;
      q = q.or(
        `title_ar.ilike.${term},title_en.ilike.${term},author_ar.ilike.${term},author_en.ilike.${term},publisher_ar.ilike.${term},publisher_en.ilike.${term}`,
      );
    }
    if (categoryId) {
      if (categoryProductIds && categoryProductIds.length) {
        const list = categoryProductIds.map((id) => `"${id}"`).join(",");
        q = q.or(`category_id.eq.${categoryId},id.in.(${list})`);
      } else {
        q = q.eq("category_id", categoryId);
      }
    }

    if (typeof data.min_price === "number") q = q.gte("price", data.min_price);
    if (typeof data.max_price === "number") q = q.lte("price", data.max_price);
    if (typeof data.min_rating === "number") q = q.gte("rating", data.min_rating);
    if (data.in_stock) q = q.or("unlimited_stock.eq.true,stock.gt.0");

    switch (data.sort) {
      case "price-asc":
        q = q.order("price", { ascending: true });
        break;
      case "price-desc":
        q = q.order("price", { ascending: false });
        break;
      case "rating":
        q = q.order("rating", { ascending: false });
        break;
      case "new":
        q = q.order("created_at", { ascending: false });
        break;
      case "relevance":
      default:
        q = q.order("display_order" as any, { ascending: true }).order("created_at", { ascending: false });
    }


    q = q.limit(data.limit ?? 60);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { products: (rows ?? []) as UIProduct[], total: count ?? rows?.length ?? 0 };
  });

export const listRelatedProductsPublic = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        product_id: z.string().uuid(),
        limit: z.number().int().min(1).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ products: UIProduct[] }> => {
    const supabase = getPublicClient();
    const { data: base } = await supabase
      .from("products")
      .select("category_id")
      .eq("id", data.product_id)
      .maybeSingle();

    const limit = data.limit ?? 8;
    let q = supabase
      .from("products")
      .select(PRODUCT_COLS)
      .eq("is_active", true)
      .neq("id", data.product_id)
      .order("rating", { ascending: false })
      .limit(limit);
    if (base?.category_id) q = q.eq("category_id", base.category_id);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { products: (rows ?? []) as UIProduct[] };
  });
