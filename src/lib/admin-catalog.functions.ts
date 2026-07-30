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

/**
 * Returns the service-role client when it is usable, otherwise falls back to the
 * authenticated (already verified as admin) user client so the dashboard keeps
 * working even when the self-hosted service key is missing/misconfigured.
 */
async function getWriteClient(context: any) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Touch the proxy so a bad/missing key throws here, not mid-write.
    void supabaseAdmin.from("products");
    return supabaseAdmin as any;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[admin-catalog] service-role client unavailable, using user client:", message);
    return context.supabase as any;
  }
}


// ---------- Categories ----------
const categoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .max(80)
    .transform((s) => s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .optional()
    .or(z.literal("")),


  name_ar: z.string().trim().min(1).max(120),
  name_en: z.string().trim().min(1).max(120),
  description_ar: z.string().trim().max(500).optional().or(z.literal("")),
  description_en: z.string().trim().max(500).optional().or(z.literal("")),
  image_url: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(20).optional().or(z.literal("")),
  display_order: z.number().int().min(0).max(9999).optional(),
  nav_order: z.number().int().min(0).max(9999).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  show_in_nav: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const listCategoriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const loadCategories = async (client: any) => {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return { categories: await loadCategories(supabaseAdmin) };
    } catch (adminError) {
      const message = adminError instanceof Error ? adminError.message : String(adminError);
      console.warn("[listCategoriesAdmin] admin client failed, falling back to user client:", message);
      return { categories: await loadCategories(context.supabase) };
    }
  });

export const upsertCategoryAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => categoryInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const finalSlug = data.slug && data.slug.length >= 2
      ? data.slug
      : await ensureUniqueSlug(supabaseAdmin, "categories", data.name_en || data.name_ar, data.id);
    const payload = {
      slug: finalSlug,
      name_ar: data.name_ar,
      name_en: data.name_en,
      description_ar: data.description_ar || null,
      description_en: data.description_en || null,
      image_url: data.image_url || null,
      icon: data.icon || data.image_url || null,
      display_order: data.display_order ?? 0,
      nav_order: data.nav_order ?? data.display_order ?? 0,
      parent_id: data.parent_id ?? null,
      show_in_nav: data.show_in_nav ?? true,
      is_active: data.is_active ?? true,
    };
    const selectCols = "id, name_ar, name_en, slug, icon, image_url, display_order, nav_order, parent_id, show_in_nav, is_active";
    let savedCategory: any = null;
    if (data.id) {
      const { data: updatedRows, error } = await supabaseAdmin
        .from("categories")
        .update(payload)
        .eq("id", data.id)
        .select(selectCols);
      if (error) throw new Error(error.message);
      savedCategory = updatedRows?.[0] ?? null;
      if (!savedCategory) {
        throw new Error("لم يتم تحديث التصنيف: لم يتم العثور على التصنيف المطلوب في قاعدة البيانات.");
      }
    } else {
      const { data: insertedRows, error } = await supabaseAdmin
        .from("categories")
        .insert(payload)
        .select(selectCols);
      if (error) throw new Error(error.message);
      savedCategory = insertedRows?.[0] ?? null;
      if (!savedCategory) {
        throw new Error("تم إرسال التصنيف لكن قاعدة البيانات لم ترجع الصف المحفوظ.");
      }
    }
    return { ok: true, category: savedCategory };

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
    .max(120)
    .transform((s) => s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .optional()
    .or(z.literal("")),


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
  cost_price: z.number().min(0).max(1000000).optional(),
  marketing_cost: z.number().min(0).max(1000000).optional(),
  misc_expenses: z.number().min(0).max(1000000).optional(),
  cover_url: z.string().trim().max(5_000_000).optional().or(z.literal("")),
  category_id: z.string().uuid().optional().nullable(),
  category_ids: z.array(z.string().uuid()).optional(),
  pages: z.number().int().min(0).max(20000).optional().nullable(),
  isbn: z.string().trim().max(40).optional().or(z.literal("")),
  stock: z.number().int().min(0).max(100000),
  unlimited_stock: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_bestseller: z.boolean().optional(),
  is_new_arrival: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  display_order: z.number().int().min(-99999).max(99999).optional(),
});

async function syncProductCategories(supabaseAdmin: any, productId: string, categoryIds: string[]) {
  const desired: string[] = Array.from(new Set(categoryIds.filter(Boolean)));
  const relationMissingMessage =
    "جدول ربط التصنيفات غير موجود. نفّذ db/product_categories_junction.sql على قاعدة البيانات ثم أعد المحاولة.";

  const readLinks = async (): Promise<string[]> => {
    const { data, error } = await supabaseAdmin
      .from("product_categories" as any)
      .select("category_id")
      .eq("product_id", productId);
    if (error) {
      if (/relation .*product_categories.* does not exist|schema cache|Could not find/i.test(error.message)) {
        throw new Error(relationMissingMessage);
      }
      throw new Error(`فشل قراءة تصنيفات المنتج: ${error.message}`);
    }
    return (data ?? []).map((link: any) => link.category_id as string).filter(Boolean);
  };

  const writeDirectly = async () => {
    const existing = await readLinks();
    const existingSet = new Set(existing);
    const desiredSet = new Set(desired);
    const toInsert = desired.filter((categoryId) => !existingSet.has(categoryId));
    const toDelete = existing.filter((categoryId) => !desiredSet.has(categoryId));

    if (toInsert.length) {
      const { error } = await supabaseAdmin
        .from("product_categories" as any)
        .upsert(
          toInsert.map((categoryId) => ({ product_id: productId, category_id: categoryId })),
          { onConflict: "product_id,category_id", ignoreDuplicates: true },
        );
      if (error) throw new Error(`فشل إضافة التصنيفات الجديدة: ${error.message}`);
    }

    if (toDelete.length) {
      const { error } = await supabaseAdmin
        .from("product_categories" as any)
        .delete()
        .eq("product_id", productId)
        .in("category_id", toDelete);
      if (error) throw new Error(`فشل حذف التصنيفات القديمة: ${error.message}`);
    }
  };

  try {
    await writeDirectly();
  } catch (directError) {
    const directMessage = directError instanceof Error ? directError.message : String(directError);
    if (directMessage === relationMissingMessage) throw directError;

    const { error: rpcErr } = await supabaseAdmin.rpc("sync_product_categories" as any, {
      p_product_id: productId,
      p_category_ids: desired,
    });
    if (rpcErr) {
      if (/function .* does not exist|schema cache|Could not find the function/i.test(rpcErr.message)) {
        throw new Error(`فشل تحديث التصنيفات مباشرة، ودالة sync_product_categories غير موجودة. السبب: ${directMessage}`);
      }
      throw new Error(`فشل تحديث التصنيفات: ${rpcErr.message}. السبب المباشر: ${directMessage}`);
    }
  }

  const saved = await readLinks();
  const savedSet = new Set(saved);
  const sameCount = savedSet.size === desired.length;
  const sameValues = desired.every((categoryId) => savedSet.has(categoryId));
  if (!sameCount || !sameValues) {
    throw new Error(
      `تم حفظ المنتج لكن تصنيفات الربط لم تتسجل بالكامل. المطلوب: ${desired.length}، المسجل: ${savedSet.size}.`,
    );
  }
  return desired;
}



export const listProductsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const loadProducts = async (client: any) => {
      const PAGE = 1000;
      const all: any[] = [];
      for (let from = 0; from < 50000; from += PAGE) {
        const { data, error } = await client
          .from("products")
          .select("*")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
      }
      // Attach category_ids from junction table (best-effort; never break the list on failure).
      try {
        const ids = all.map((p) => p.id);
        const map = new Map<string, string[]>();
        if (ids.length) {
          for (let i = 0; i < ids.length; i += 50) {
            const slice = ids.slice(i, i + 50);
            const { data: links, error: linksError } = await client
              .from("product_categories" as any)
              .select("product_id, category_id")
              .in("product_id", slice);
            if (linksError) {
              console.error("[listProductsAdmin] junction chunk failed:", linksError.message);
              continue;
            }
            (links ?? []).forEach((link: any) => {
              const arr = map.get(link.product_id) ?? [];
              if (!arr.includes(link.category_id)) arr.push(link.category_id);
              map.set(link.product_id, arr);
            });
          }
        }
        for (const p of all) {
          const linked = map.get(p.id) ?? [];
          if (p.category_id && !linked.includes(p.category_id)) linked.unshift(p.category_id);
          p.category_ids = linked;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[listProductsAdmin] junction attach failed:", message);
        for (const p of all) p.category_ids = p.category_id ? [p.category_id] : [];
      }
      return all;
    };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return { products: await loadProducts(supabaseAdmin) };
    } catch (adminError) {
      const message = adminError instanceof Error ? adminError.message : String(adminError);
      console.warn("[listProductsAdmin] admin client failed, falling back to user client:", message);
      return { products: await loadProducts(context.supabase) };
    }
  });


export const upsertProductAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productInput.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const finalSlug = data.slug && data.slug.length >= 2
      ? data.slug
      : await ensureUniqueSlug(supabaseAdmin, "products", data.title_en || data.title_ar, data.id);
    const catIds = Array.from(new Set([
      ...(data.category_ids ?? []),
      ...(data.category_id ? [data.category_id] : []),
    ]));
    const primaryCat = catIds[0] ?? data.category_id ?? null;
    const payload = {
      slug: finalSlug,

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
      cost_price: data.cost_price ?? 0,
      marketing_cost: data.marketing_cost ?? 0,
      misc_expenses: data.misc_expenses ?? 0,
      cover_url: data.cover_url || null,
      category_id: primaryCat,
      pages: data.pages ?? null,
      isbn: data.isbn || null,
      stock: data.stock,
      unlimited_stock: data.unlimited_stock ?? false,
      is_active: data.is_active ?? true,
      is_bestseller: data.is_bestseller ?? false,
      is_new_arrival: data.is_new_arrival ?? false,
      is_featured: data.is_featured ?? false,
      display_order: data.display_order ?? 0,
    };

    // Try update/insert. If a column doesn't exist yet on the DB (e.g. display_order
    // migration not applied), retry without the optional columns so the save still works.
    async function saveProducts(p: any) {
      if (data.id) {
        const { data: updated, error } = await supabaseAdmin
          .from("products")
          .update(p)
          .eq("id", data.id)
          .select("id")
          .maybeSingle();
        return { error, id: updated?.id as string | undefined };
      } else {
        const { data: inserted, error } = await supabaseAdmin.from("products").insert(p).select("id").single();
        return { error, id: inserted?.id as string | undefined };
      }
    }
    let productId = data.id;
    let res = await saveProducts(payload as any);
    if (res.error && /display_order|column .* does not exist/i.test(res.error.message)) {
      const { display_order: _omit, ...fallback } = payload as any;
      res = await saveProducts(fallback);
    }
    if (res.error) throw new Error(`فشل حفظ المنتج: ${res.error.message}`);
    productId = res.id;
    if (!productId) {
      throw new Error("لم يتم العثور على المنتج بعد الحفظ. تأكد أن المنتج موجود ولم يتم حذفه من قاعدة البيانات.");
    }

    const savedCategoryIds = await syncProductCategories(supabaseAdmin, productId, catIds);
    return { ok: true, productId, category_ids: savedCategoryIds, category_id: primaryCat, display_order: payload.display_order };
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
