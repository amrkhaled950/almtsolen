import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CouponPreview = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  discount: number;
};

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      code: z.string().trim().min(1).max(50),
      subtotal: z.number().min(0),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<CouponPreview> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    const { data: c, error } = await supabaseAdmin
      .from("coupons").select("*").eq("code", code).maybeSingle();
    if (error) throw new Error(error.message);
    if (!c || !c.is_active) throw new Error("كوبون غير صالح");
    const now = new Date();
    if (c.starts_at && new Date(c.starts_at) > now) throw new Error("الكوبون لم يبدأ بعد");
    if (c.expires_at && new Date(c.expires_at) < now) throw new Error("الكوبون منتهي");
    if (c.usage_limit && c.used_count >= c.usage_limit) throw new Error("استُنفد حد الاستخدام");
    if (data.subtotal < Number(c.min_subtotal)) {
      throw new Error(`الحد الأدنى للطلب ${c.min_subtotal} ج.م`);
    }
    let discount = c.type === "percent"
      ? (data.subtotal * Number(c.value)) / 100
      : Number(c.value);
    if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
    discount = Math.min(discount, data.subtotal);
    discount = Math.round(discount * 100) / 100;
    return { id: c.id, code: c.code, type: c.type, value: Number(c.value), discount };
  });

// ─── Admin ───
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listCouponsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { coupons: data ?? [] };
  });

const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(50),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  min_subtotal: z.number().min(0).default(0),
  max_discount: z.number().positive().nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const saveCouponAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => couponSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: any = {
      code: data.code.toUpperCase(),
      description: data.description || null,
      type: data.type,
      value: data.value,
      min_subtotal: data.min_subtotal,
      max_discount: data.max_discount ?? null,
      usage_limit: data.usage_limit ?? null,
      starts_at: data.starts_at || null,
      expires_at: data.expires_at || null,
      is_active: data.is_active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("coupons").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("coupons").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCouponAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
