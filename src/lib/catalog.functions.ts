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
    let q = supabaseAdmin
      .from("products")
      .select(
        "id, slug, title_ar, title_en, author_ar, author_en, publisher_ar, publisher_en, description_ar, description_en, price, compare_at_price, cover_url, category_id, pages, isbn, rating, reviews_count, stock, is_active, is_bestseller, is_new_arrival, is_featured",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (categoryId) q = q.eq("category_id", categoryId);
    if (data.featured) q = q.eq("is_featured", true);
    if (data.bestseller) q = q.eq("is_bestseller", true);
    if (data.new_arrival) q = q.eq("is_new_arrival", true);
    if (data.limit) q = q.limit(data.limit);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { products: (rows ?? []) as UIProduct[] };
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
