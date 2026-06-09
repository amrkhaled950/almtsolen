import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listProductReviews = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ product_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select("id, user_id, rating, title, comment, created_at")
      .eq("product_id", data.product_id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    // Fetch profile names
    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    let names: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles").select("id, full_name").in("id", userIds);
      names = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name || "مستخدم"]));
    }
    return {
      reviews: (rows ?? []).map((r) => ({ ...r, user_name: names[r.user_id] || "مستخدم" })),
    };
  });

const upsertSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const upsertReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("reviews")
      .upsert(
        {
          user_id: userId,
          product_id: data.product_id,
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
        },
        { onConflict: "product_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ product_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("reviews").delete()
      .eq("user_id", userId).eq("product_id", data.product_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
