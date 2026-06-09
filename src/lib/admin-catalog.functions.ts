import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureUniqueSlug } from "./slugify";


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

// ---------- Categories ----------
const categoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "slug يجب أن يكون بحروف إنجليزية صغيرة وأرقام و -")
    .optional()
    .or(z.literal("")),

  name_ar: z.string().trim().min(1).max(120),
  name_en: z.string().trim().min(1).max(120),
  description_ar: z.string().trim().max(500).optional().or(z.literal("")),
  description_en: z.string().trim().max(500).optional().or(z.literal("")),
  image_url: z.string().trim().max(500).optional().or(z.literal("")),
  display_order: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

export const listCategoriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { categories: data ?? [] };
  });

export const upsertCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => categoryInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      name_ar: data.name_ar,
      name_en: data.name_en,
      description_ar: data.description_ar || null,
      description_en: data.description_en || null,
      image_url: data.image_url || null,
      display_order: data.display_order ?? 0,
      is_active: data.is_active ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("categories").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Products ----------
const productInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug يجب أن يكون بحروف إنجليزية صغيرة وأرقام و -"),
  title_ar: z.string().trim().min(1).max(200),
  title_en: z.string().trim().min(1).max(200),
  author_ar: z.string().trim().min(1).max(120),
  author_en: z.string().trim().min(1).max(120),
  publisher_ar: z.string().trim().max(120).optional().or(z.literal("")),
  publisher_en: z.string().trim().max(120).optional().or(z.literal("")),
  description_ar: z.string().trim().max(2000).optional().or(z.literal("")),
  description_en: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.number().min(0).max(1000000),
  compare_at_price: z.number().min(0).max(1000000).optional().nullable(),
  cover_url: z.string().trim().max(1000).optional().or(z.literal("")),
  category_id: z.string().uuid().optional().nullable(),
  pages: z.number().int().min(0).max(20000).optional().nullable(),
  isbn: z.string().trim().max(40).optional().or(z.literal("")),
  stock: z.number().int().min(0).max(100000),
  is_active: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
  is_new_arrival: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export const listProductsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { products: data ?? [] };
  });

export const upsertProductAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      title_ar: data.title_ar,
      title_en: data.title_en,
      author_ar: data.author_ar,
      author_en: data.author_en,
      publisher_ar: data.publisher_ar || null,
      publisher_en: data.publisher_en || null,
      description_ar: data.description_ar || null,
      description_en: data.description_en || null,
      price: data.price,
      compare_at_price: data.compare_at_price ?? null,
      cover_url: data.cover_url || null,
      category_id: data.category_id ?? null,
      pages: data.pages ?? null,
      isbn: data.isbn || null,
      stock: data.stock,
      is_active: data.is_active ?? true,
      is_bestseller: data.is_bestseller ?? false,
      is_new_arrival: data.is_new_arrival ?? false,
      is_featured: data.is_featured ?? false,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("products").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteProductAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Customers (from profiles + auth.users) ----------
export const listCustomersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    const ids = (authData?.users ?? []).map((u: any) => u.id);
    const [{ data: profiles }, { data: roles }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("orders").select("user_id, total").in("user_id", ids),
    ]);
    const pMap = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => pMap.set(p.id, p));
    const rMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rMap.set(r.user_id, arr);
    });
    const oMap = new Map<string, { count: number; total: number }>();
    (orders ?? []).forEach((o: any) => {
      const cur = oMap.get(o.user_id) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(o.total);
      oMap.set(o.user_id, cur);
    });
    const customers = (authData?.users ?? [])
      .filter((u: any) => (rMap.get(u.id) ?? []).includes("customer"))
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: pMap.get(u.id)?.full_name ?? u.user_metadata?.full_name ?? null,
        phone: pMap.get(u.id)?.phone ?? null,
        roles: rMap.get(u.id) ?? [],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        orders_count: oMap.get(u.id)?.count ?? 0,
        total_spent: oMap.get(u.id)?.total ?? 0,
      }));
    return { customers };
  });

// ---------- Analytics ----------
export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [orders, products, authUsers] = await Promise.all([
      supabaseAdmin.from("orders").select("id, total, status, payment_method, created_at, shipping_address"),
      supabaseAdmin.from("products").select("id, stock, is_active"),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    return {
      orders: orders.data ?? [],
      products_total: products.data?.length ?? 0,
      products_out_of_stock: (products.data ?? []).filter((p: any) => p.stock === 0).length,
      users_total: authUsers.data?.users?.length ?? 0,
    };
  });
