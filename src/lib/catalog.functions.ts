import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  "id, slug, title_ar, title_en, author_ar, author_en, publisher_ar, publisher_en, description_ar, description_en, price, compare_at_price, cover_url, category_id, pages, isbn, rating, reviews_count, stock, is_active, is_bestseller, is_new_arrival, is_featured";

export const listCategoriesPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ categories: UICategory[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let categoryId: string | null = null;
    if (data.category_slug) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.category_slug)
        .maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) return { products: [] };
    }
    const buildQuery = () => {
      let q = supabaseAdmin
        .from("products")
        .select(PRODUCT_COLS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (categoryId) q = q.eq("category_id", categoryId);
      if (data.featured) q = q.eq("is_featured", true);
      if (data.bestseller) q = q.eq("is_bestseller", true);
      if (data.new_arrival) q = q.eq("is_new_arrival", true);
      return q;
    };

    if (data.limit) {
      const { data: rows, error } = await buildQuery().limit(data.limit);
      if (error) throw new Error(error.message);
      return { products: (rows ?? []) as UIProduct[] };
    }

    const PAGE = 500;
    const all: UIProduct[] = [];
    for (let from = 0; from < 20000; from += PAGE) {
      const { data: rows, error } = await buildQuery().range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!rows?.length) break;
      all.push(...(rows as UIProduct[]));
      if (rows.length < PAGE) break;
    }
    return { products: all };
  });

export const getProductPublic = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }): Promise<{ product: UIProduct | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .select(
        "id, slug, title_ar, title_en, author_ar, author_en, publisher_ar, publisher_en, description_ar, description_en, price, compare_at_price, cover_url, category_id, pages, isbn, rating, reviews_count, stock, is_active, is_bestseller, is_new_arrival, is_featured",
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let categoryId: string | null = null;
    if (data.category_slug) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.category_slug)
        .maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) return { products: [], total: 0 };
    }

    let q = supabaseAdmin
      .from("products")
      .select(PRODUCT_COLS, { count: "exact" })
      .eq("is_active", true);

    if (data.q) {
      const term = `%${escapeIlike(data.q)}%`;
      q = q.or(
        `title_ar.ilike.${term},title_en.ilike.${term},author_ar.ilike.${term},author_en.ilike.${term},publisher_ar.ilike.${term},publisher_en.ilike.${term}`,
      );
    }
    if (categoryId) q = q.eq("category_id", categoryId);
    if (typeof data.min_price === "number") q = q.gte("price", data.min_price);
    if (typeof data.max_price === "number") q = q.lte("price", data.max_price);
    if (typeof data.min_rating === "number") q = q.gte("rating", data.min_rating);
    if (data.in_stock) q = q.gt("stock", 0);

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
      case "relevance":
      default:
        q = q.order("created_at", { ascending: false });
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: base } = await supabaseAdmin
      .from("products")
      .select("category_id")
      .eq("id", data.product_id)
      .maybeSingle();

    const limit = data.limit ?? 8;
    let q = supabaseAdmin
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
