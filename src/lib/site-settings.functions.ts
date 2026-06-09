import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteSettings = {
  id: number;
  logo_url: string | null;
  favicon_url: string | null;
  site_name_ar: string | null;
  site_name_en: string | null;
  tagline_ar: string | null;
  tagline_en: string | null;
  meta_description_ar: string | null;
  meta_description_en: string | null;
  hero_images: Array<{ url: string; title_ar?: string; title_en?: string; link?: string }>;
  hero_title_ar: string | null;
  hero_title_en: string | null;
  hero_subtitle_ar: string | null;
  hero_subtitle_en: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  social_whatsapp: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address_ar: string | null;
  contact_address_en: string | null;
  footer_about_ar: string | null;
  footer_about_en: string | null;
  privacy_policy_ar: string | null;
  privacy_policy_en: string | null;
  terms_ar: string | null;
  terms_en: string | null;
  refund_policy_ar: string | null;
  refund_policy_en: string | null;
  shipping_policy_ar: string | null;
  shipping_policy_en: string | null;
  about_ar: string | null;
  about_en: string | null;
  custom_strings: Record<string, { ar?: string; en?: string }>;
};

export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ settings: SiteSettings | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { settings: (data as SiteSettings | null) ?? null };
  },
);

// Public alias (no auth) – same behavior, semantic clarity for public callers
export const getPublicSiteSettings = getSiteSettings;

const updateSchema = z
  .object({
    logo_url: z.string().max(1000).optional().nullable(),
    favicon_url: z.string().max(1000).optional().nullable(),
    site_name_ar: z.string().max(120).optional().nullable(),
    site_name_en: z.string().max(120).optional().nullable(),
    tagline_ar: z.string().max(200).optional().nullable(),
    tagline_en: z.string().max(200).optional().nullable(),
    meta_description_ar: z.string().max(500).optional().nullable(),
    meta_description_en: z.string().max(500).optional().nullable(),
    hero_images: z
      .array(
        z.object({
          url: z.string().max(1000),
          title_ar: z.string().max(200).optional(),
          title_en: z.string().max(200).optional(),
          link: z.string().max(500).optional(),
        }),
      )
      .max(20)
      .optional(),
    hero_title_ar: z.string().max(200).optional().nullable(),
    hero_title_en: z.string().max(200).optional().nullable(),
    hero_subtitle_ar: z.string().max(300).optional().nullable(),
    hero_subtitle_en: z.string().max(300).optional().nullable(),
    social_facebook: z.string().max(500).optional().nullable(),
    social_instagram: z.string().max(500).optional().nullable(),
    social_twitter: z.string().max(500).optional().nullable(),
    social_tiktok: z.string().max(500).optional().nullable(),
    social_youtube: z.string().max(500).optional().nullable(),
    social_whatsapp: z.string().max(50).optional().nullable(),
    contact_phone: z.string().max(50).optional().nullable(),
    contact_email: z.string().max(255).optional().nullable(),
    contact_address_ar: z.string().max(500).optional().nullable(),
    contact_address_en: z.string().max(500).optional().nullable(),
    footer_about_ar: z.string().max(1000).optional().nullable(),
    footer_about_en: z.string().max(1000).optional().nullable(),
    privacy_policy_ar: z.string().max(50000).optional().nullable(),
    privacy_policy_en: z.string().max(50000).optional().nullable(),
    terms_ar: z.string().max(50000).optional().nullable(),
    terms_en: z.string().max(50000).optional().nullable(),
    refund_policy_ar: z.string().max(50000).optional().nullable(),
    refund_policy_en: z.string().max(50000).optional().nullable(),
    shipping_policy_ar: z.string().max(50000).optional().nullable(),
    shipping_policy_en: z.string().max(50000).optional().nullable(),
    about_ar: z.string().max(50000).optional().nullable(),
    about_en: z.string().max(50000).optional().nullable(),
    custom_strings: z.record(z.string(), z.object({ ar: z.string().optional(), en: z.string().optional() })).optional(),
  })
  .strict();

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

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
