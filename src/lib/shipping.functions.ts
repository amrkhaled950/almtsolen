import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface GovernorateShipping {
  governorate_en: string;
  governorate_ar: string;
  price: number;
  enabled: boolean;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

// Get all shipping rates (public - used in checkout)
export const getShippingRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rates: GovernorateShipping[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("shipping_rates")
      .select("*")
      .order("governorate_ar");
    if (error) throw new Error(error.message);
    return { rates: (data ?? []) as unknown as GovernorateShipping[] };
  }
);

// Upsert shipping rates (admin)
export const upsertShippingRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      rates: z.array(
        z.object({
          governorate_en: z.string(),
          governorate_ar: z.string(),
          price: z.number().min(0),
          enabled: z.boolean(),
        })
      ),
    }).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("shipping_rates")
      .upsert(data.rates, { onConflict: "governorate_en" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
