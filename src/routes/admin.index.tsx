import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, ArrowUpRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalyticsAdmin } from "@/lib/admin-analytics.functions";
import { useLocale, formatPrice } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const orderStatusLabel: Record<string, { ar: string; en: string; color: string }> = {
  pending:    { ar: "قيد الانتظار",  en: "Pending",    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  confirmed:  { ar: "مؤكد",          en: "Confirmed",  color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
  processing: { ar: "قيد المعالجة", en: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  shipped:    { ar: "تم الشحن",      en: "Shipped",    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  delivered:  { ar: "تم التسليم",   en: "Delivered",  color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  cancelled:  { ar: "ملغي",          en: "Cancelled",  color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  refunded:   { ar: "مسترجع",        en: "Refunded",   color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
};

function Dashboard() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";

  const fetchAnalytics = useServerFn(getAnalyticsAdmin);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fetchAnalytics(),
    staleTime: 1000 * 60 * 5,
  });

  const chartData = (data?.salesByDay ?? []).slice(-14).map((d: any) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "2-digit", month: "short" }),
  }));

  const recentOrders = data?.recentOrders ?? [];
  const topProducts  = data?.topProducts ?? [];
  const outOfStock   = data?.outOfStock ?? 0;

  const kpis = [
    {
      label: isAr ? "إجمالي الإيرادات" : "Total revenue",
      value: isLoading ? "—" : formatPrice(data?.totalRevenue ?? 0, locale),
      change: "",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40",
    },
    {
      label: isAr ? "الطلبات" : "Orders",
      value: isLoading ? "—" : (data?.totalOrders ?? 0).toString(),
      change: "",
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40",
    },
    {
      label: isAr ? "العملاء" : "Customers",
      value: isLoading ? "—" : (data?.totalCustomers ?? 0).toString(),
      change: "",
      icon: Users,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-950/40",
    },
    {
      label: isAr ? "المنتجات" : "Products",
      value: isLoading ? "—" : (data?.totalProducts ?? 0).toString(),
      change: outOfStock > 0 ? `${outOfStock} ${isAr ? "نفد" : "out"}` : "",
      icon: Package,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl">
            {isAr ? "مرحباً بك 👋" : "Welcome back 👋"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? "إليك نظرة سريعة على متجرك اليوم" : "Here's how your store is doing today"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/orders"
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover flex items-center gap-1.5"
          >
            {isAr ? "عرض الطلبات" : "View orders"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card-soft">
            <div className="flex items-start justify-between">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              {k.change && <span className="text-xs font-semibold text-amber-600">{k.change}</span>}
            </div>
            <div className="mt-4 text-2xl font-black font-display">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : k.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-lg">{isAr ? "المبيعات" : "Sales"}</h2>
              <p className="text-xs text-muted-foreground">{isAr ? "آخر 14 يوم" : "Last 14 days"}</p>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (isAr ? "لا توجد بيانات بعد" : "No data yet")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={2} fill="url(#salesGrad)" name={isAr ? "المبيعات" : "Sales"} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <h2 className="font-display font-bold text-lg mb-1">{isAr ? "الطلبات اليومية" : "Daily orders"}</h2>
          <p className="text-xs text-muted-foreground mb-4">{isAr ? "آخر 14 يوم" : "Last 14 days"}</p>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (isAr ? "لا توجد بيانات بعد" : "No data yet")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="orders" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name={isAr ? "الطلبات" : "Orders"} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display font-bold text-lg">{isAr ? "أحدث الطلبات" : "Recent orders"}</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-primary hover:underline">
              {isAr ? "عرض الكل" : "View all"}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-start px-5 py-3 font-medium">{isAr ? "الطلب" : "Order"}</th>
                  <th className="text-start px-5 py-3 font-medium">{isAr ? "العميل" : "Customer"}</th>
                  <th className="text-start px-5 py-3 font-medium">{isAr ? "الحالة" : "Status"}</th>
                  <th className="text-end px-5 py-3 font-medium">{isAr ? "الإجمالي" : "Total"}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={4} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></td></tr>
                )}
                {!isLoading && recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">{isAr ? "لا توجد طلبات بعد" : "No orders yet"}</td></tr>
                )}
                {recentOrders.map((o: any) => {
                  const addr: any = o.shipping_address ?? {};
                  const name = o.guest_name || addr.full_name || "—";
                  const city = addr.governorate || addr.city || "—";
                  const s = orderStatusLabel[o.status] ?? orderStatusLabel.pending;
                  return (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-5 py-3 font-semibold">{o.order_number}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">{city}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
                          {isAr ? s.ar : s.en}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-end font-bold">{formatPrice(Number(o.total), locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-bold text-lg">{isAr ? "أفضل المنتجات" : "Top products"}</h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading && (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            )}
            {!isLoading && topProducts.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">{isAr ? "لا توجد مبيعات بعد" : "No sales yet"}</div>
            )}
            {topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{isAr ? p.title_ar : (p.title_en || p.title_ar)}</div>
                  <div className="text-xs text-muted-foreground">{p.units} {isAr ? "وحدة" : "units"}</div>
                </div>
                <div className="text-sm font-bold text-primary">{formatPrice(p.revenue, locale)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert */}
      {outOfStock > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-start gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 dark:text-amber-200">
              {isAr ? `لديك ${outOfStock} منتج نفد من المخزون` : `${outOfStock} product(s) out of stock`}
            </h3>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              {isAr ? "راجع المخزون لتجديد الكميات." : "Review inventory to restock items."}
            </p>
          </div>
          <Link to="/admin/products" className="h-9 px-3 rounded-md bg-amber-900 text-amber-50 text-sm font-medium hover:bg-amber-800 flex items-center">
            {isAr ? "عرض المنتجات" : "View products"}
          </Link>
        </div>
      )}
    </div>
  );
}
