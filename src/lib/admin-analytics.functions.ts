import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const getAnalyticsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from?: string; to?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve date range (default: last 30 days)
    const toDate = data.to ? new Date(data.to) : new Date();
    const fromDate = data.from ? new Date(data.from) : new Date(toDate.getTime() - 30 * 86400000);
    // Include the full "to" day
    const toBound = new Date(toDate);
    toBound.setHours(23, 59, 59, 999);
    const fromBound = new Date(fromDate);
    fromBound.setHours(0, 0, 0, 0);

    let q = supabaseAdmin
      .from("orders")
      .select(`
        id, order_number, created_at, status, total, subtotal, shipping_cost,
        payment_method, guest_name, guest_phone,
        shipping_address,
        order_items ( product_id, product_title_ar, product_title_en, quantity, unit_price, line_total )
      `)
      .gte("created_at", fromBound.toISOString())
      .lte("created_at", toBound.toISOString())
      .order("created_at", { ascending: false });

    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    const rows = orders ?? [];

    // ── Revenue by day ─────────────────────────────────────────────────────
    const dayMap = new Map<string, { sales: number; orders: number }>();
    // seed days
    for (let t = fromBound.getTime(); t <= toBound.getTime(); t += 86400000) {
      const d = new Date(t).toISOString().slice(0, 10);
      dayMap.set(d, { sales: 0, orders: 0 });
    }
    rows.forEach((o: any) => {
      const d = new Date(o.created_at).toISOString().slice(0, 10);
      const cur = dayMap.get(d) ?? { sales: 0, orders: 0 };
      cur.sales += Number(o.total);
      cur.orders += 1;
      dayMap.set(d, cur);
    });
    const salesByDay = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    // ── KPIs ───────────────────────────────────────────────────────────────
    const totalRevenue = rows.reduce((s: number, o: any) => s + Number(o.total), 0);
    const totalOrders = rows.length;
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

    const phones = new Set(rows.map((o: any) => o.guest_phone || (o.shipping_address as any)?.phone).filter(Boolean));
    const totalCustomers = phones.size;

    // ── Status breakdown ──────────────────────────────────────────────────
    const statusMap = new Map<string, number>();
    rows.forEach((o: any) => statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1));
    const statusData = Array.from(statusMap.entries()).map(([status, value]) => ({ status, value }));

    // ── Top products ──────────────────────────────────────────────────────
    const prodMap = new Map<string, { title_ar: string; title_en: string; units: number; revenue: number }>();
    rows.forEach((o: any) => {
      (o.order_items ?? []).forEach((it: any) => {
        const cur = prodMap.get(it.product_id) ?? { title_ar: it.product_title_ar, title_en: it.product_title_en, units: 0, revenue: 0 };
        cur.units += it.quantity;
        cur.revenue += Number(it.line_total);
        prodMap.set(it.product_id, cur);
      });
    });
    const topProducts = Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Top cities ─────────────────────────────────────────────────────────
    const cityMap = new Map<string, { revenue: number; orders: number }>();
    rows.forEach((o: any) => {
      const addr: any = o.shipping_address ?? {};
      const city = addr.governorate || addr.city || "—";
      const cur = cityMap.get(city) ?? { revenue: 0, orders: 0 };
      cur.revenue += Number(o.total);
      cur.orders += 1;
      cityMap.set(city, cur);
    });
    const topCities = Array.from(cityMap.entries())
      .map(([city, v]) => ({ city, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Payment methods ────────────────────────────────────────────────────
    const payMap = new Map<string, number>();
    rows.forEach((o: any) => payMap.set(o.payment_method, (payMap.get(o.payment_method) ?? 0) + Number(o.total)));
    const paymentData = Array.from(payMap.entries()).map(([method, value]) => ({ method, value: Math.round(value) }));

    // ── Orders by hour ─────────────────────────────────────────────────────
    const hourMap = new Map<number, number>();
    rows.forEach((o: any) => {
      const h = new Date(o.created_at).getHours();
      hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
    });
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      orders: hourMap.get(h) ?? 0,
    }));

    const recentOrders = rows.slice(0, 6);

    // Products stats (global, not range-scoped)
    const { data: productsData } = await supabaseAdmin
      .from("products")
      .select("id, is_active, stock, track_stock");
    const allProducts = productsData ?? [];
    const totalProducts = allProducts.length;
    const outOfStock = allProducts.filter((p: any) => p.track_stock && p.stock === 0).length;

    return {
      from: fromBound.toISOString(),
      to: toBound.toISOString(),
      salesByDay,
      totalRevenue,
      totalOrders,
      avgOrder,
      totalCustomers,
      statusData,
      topProducts,
      topCities,
      paymentData,
      hourly,
      recentOrders,
      totalProducts,
      outOfStock,
    };
  });
