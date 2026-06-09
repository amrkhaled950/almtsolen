import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EG_PHONE_REGEX } from "@/lib/governorates";

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(EG_PHONE_REGEX, "رقم الهاتف غير صحيح"),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  governorate: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(80),
  street: z.string().trim().min(2).max(200),
  building: z.string().trim().max(60).optional().or(z.literal("")),
  apartment: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  payment_method: z.enum(["cod"]).default("cod"),
  coupon_code: z.string().trim().max(50).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(50),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get authenticated user (optional — guests allowed)
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const authHeader = getRequestHeader("authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: u } = await supabaseAdmin.auth.getUser(token);
      userId = u?.user?.id ?? null;
    }

    // Fetch products fresh from DB
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, title_ar, title_en, price, cover_url, stock, is_active")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== ids.length)
      throw new Error("بعض المنتجات لم تعد متوفرة");

    let subtotal = 0;
    const orderItems = data.items.map((it) => {
      const p = products.find((x) => x.id === it.product_id);
      if (!p || !p.is_active) throw new Error("منتج غير صالح");
      if (p.stock < it.quantity) throw new Error(`المخزون غير كافٍ للمنتج: ${p.title_ar}`);
      const line = Number(p.price) * it.quantity;
      subtotal += line;
      return {
        product_id: p.id,
        product_title_ar: p.title_ar,
        product_title_en: p.title_en,
        product_cover: p.cover_url,
        unit_price: Number(p.price),
        quantity: it.quantity,
        line_total: line,
      };
    });

    const shipping = subtotal >= 500 ? 0 : 50;
    const total = subtotal + shipping;

    const shipping_address = {
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      governorate: data.governorate,
      city: data.city,
      street: data.street,
      building: data.building || null,
      apartment: data.apartment || null,
    };

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        guest_name: userId ? null : data.full_name,
        guest_phone: data.phone,
        guest_email: data.email || null,
        status: "pending",
        payment_method: "cod",
        payment_status: "pending",
        subtotal,
        shipping_cost: shipping,
        discount: 0,
        total,
        shipping_address,
        notes: data.notes || null,
      })
      .select("id, order_number")
      .single();
    if (oErr) throw new Error(oErr.message);

    const itemsWithOrder = orderItems.map((i) => ({ ...i, order_id: order.id }));
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(itemsWithOrder);
    if (iErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(iErr.message);
    }

    // Decrement stock
    for (const it of data.items) {
      const p = products.find((x) => x.id === it.product_id)!;
      await supabaseAdmin
        .from("products")
        .update({ stock: Math.max(0, p.stock - it.quantity) })
        .eq("id", it.product_id);
    }

    return { ok: true, order_number: order.order_number, id: order.id };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_method, payment_status, total, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

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

export const listOrdersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, payment_method, payment_status, subtotal, shipping_cost, discount, total, shipping_address, guest_name, guest_phone, guest_email, notes, tracking_number, user_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

export const getOrderAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: order }, { data: items }] = await Promise.all([
      supabaseAdmin.from("orders").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("order_items").select("*").eq("order_id", data.id),
    ]);
    if (!order) throw new Error("Order not found");
    return { order, items: items ?? [] };
  });

export const updateOrderStatusAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOrderAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("order_items").delete().eq("order_id", data.id);
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────── CSV export ─────────────
function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/\r?\n/g, " ").trim();
  if (/[",;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const exportOrdersCsvAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        status: z
          .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"])
          .optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select(
        "order_number, status, payment_method, payment_status, subtotal, shipping_cost, discount, total, shipping_address, guest_name, guest_phone, guest_email, notes, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const headers = [
      "order_number","created_at","status","payment_method","payment_status",
      "customer_name","customer_phone","customer_email",
      "governorate","city","street","building","apartment",
      "subtotal","shipping","discount","total","notes",
    ];
    const lines = [headers.join(",")];
    for (const o of rows ?? []) {
      const addr: any = o.shipping_address || {};
      lines.push([
        o.order_number, o.created_at, o.status, o.payment_method, o.payment_status,
        o.guest_name || addr.full_name || "",
        o.guest_phone || addr.phone || "",
        o.guest_email || addr.email || "",
        addr.governorate || "", addr.city || "", addr.street || "",
        addr.building || "", addr.apartment || "",
        o.subtotal, o.shipping_cost, o.discount, o.total,
        o.notes || "",
      ].map(csvEscape).join(","));
    }
    return { csv: "\uFEFF" + lines.join("\n"), count: rows?.length ?? 0 };
  });
