import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("wishlist")
      .select("product_id, products(id, slug, title_ar, title_en, author_ar, author_en, price, compare_at_price, cover_url, stock, rating, reviews_count, is_active)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const products = (data ?? [])
      .map((r: any) => r.products)
      .filter((p: any) => p && p.is_active);
    return { products };
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ product_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("wishlist").select("id")
      .eq("user_id", userId).eq("product_id", data.product_id).maybeSingle();
    if (existing) {
      await supabase.from("wishlist").delete().eq("id", existing.id);
      return { in: false };
    } else {
      const { error } = await supabase.from("wishlist")
        .insert({ user_id: userId, product_id: data.product_id });
      if (error) throw new Error(error.message);
      return { in: true };
    }
  });

export const syncWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ product_ids: z.array(z.string().uuid()).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.product_ids.length === 0) return { ok: true };
    const rows = data.product_ids.map((pid) => ({ user_id: userId, product_id: pid }));
    // Upsert ignoring duplicates
    const { error } = await supabase.from("wishlist").upsert(rows, { onConflict: "user_id,product_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
