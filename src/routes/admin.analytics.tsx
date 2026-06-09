import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar,
} from "recharts";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp, DollarSign, ShoppingBag, Users, Package,
  MapPin, Award, Loader2, Calendar as CalendarIcon,
} from "lucide-react";
import { getAnalyticsAdmin } from "@/lib/admin-analytics.functions";
import { useLocale, formatPrice } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#98040c", "#f59e0b", "#3b82f6", "#10b981", "#a855f7", "#ec4899"];

const orderStatusLabel: Record<string, { ar: string; en: string }> = {
  pending:    { ar: "قيد الانتظار",  en: "Pending" },
  confirmed:  { ar: "مؤكد",          en: "Confirmed" },
  processing: { ar: "قيد المعالجة", en: "Processing" },
  shipped:    { ar: "تم الشحن",      en: "Shipped" },
  delivered:  { ar: "تم التسليم",   en: "Delivered" },
  cancelled:  { ar: "ملغي",          en: "Cancelled" },
  refunded:   { ar: "مسترجع",        en: "Refunded" },
};

const paymentLabel: Record<string, { ar: string; en: string }> = {
  cod:           { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  paymob_card:   { ar: "بطاقة",              en: "Card" },
  paymob_wallet: { ar: "محفظة",              en: "Wallet" },
};

type Preset = "7d" | "14d" | "30d" | "90d" | "custom";

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n + 1);
  return d;
}

function AnalyticsPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";

  const [preset, setPreset] = useState<Preset>("30d");
  const [from, setFrom] = useState<Date>(daysAgo(30));
  const [to, setTo] = useState<Date>(new Date());

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === "custom") return;
    const n = p === "7d" ? 7 : p === "14d" ? 14 : p === "30d" ? 30 : 90;
    setFrom(daysAgo(n));
    setTo(new Date());
  };

  const fetchAnalytics = useServerFn(getAnalyticsAdmin);
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", fromIso, toIso],
    queryFn: () => fetchAnalytics({ data: { from: fromIso, to: toIso } }),
    staleTime: 1000 * 60 * 2,
  });

  const chartData = useMemo(() => {
    if (!data?.salesByDay) return [];
    return data.salesByDay.map((d: any) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "2-digit", month: "short" }),
    }));
  }, [data, isAr]);

  const rangeRevenue = chartData.reduce((s: number, d: any) => s + d.sales, 0);
  const rangeOrders  = chartData.reduce((s: number, d: any) => s + d.orders, 0);

  const statusData = useMemo(() =>
    (data?.statusData ?? []).map((s: any) => ({
      name: isAr ? (orderStatusLabel[s.status]?.ar ?? s.status) : (orderStatusLabel[s.status]?.en ?? s.status),
      value: s.value,
    })),
  [data, isAr]);

  const paymentData = useMemo(() =>
    (data?.paymentData ?? []).map((p: any) => ({
      name: isAr ? (paymentLabel[p.method]?.ar ?? p.method) : (paymentLabel[p.method]?.en ?? p.method),
      value: p.value,
    })),
  [data, isAr]);

  const topProducts = data?.topProducts ?? [];
  const topCities   = data?.topCities ?? [];
  const hourly      = data?.hourly ?? [];

  const kpis = [
    {
      label: isAr ? "إجمالي الإيرادات" : "Total Revenue",
      value: formatPrice(data?.totalRevenue ?? 0, locale),
      sub: isAr ? `${formatPrice(rangeRevenue, locale)} في الفترة` : `${formatPrice(rangeRevenue, locale)} in range`,
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: isAr ? "إجمالي الطلبات" : "Total Orders",
      value: (data?.totalOrders ?? 0).toLocaleString(),
      sub: isAr ? `${rangeOrders} في الفترة` : `${rangeOrders} in range`,
      icon: ShoppingBag,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: isAr ? "متوسط قيمة الطلب" : "Avg Order Value",
      value: formatPrice(data?.avgOrder ?? 0, locale),
      sub: isAr ? "على كل الطلبات" : "across all orders",
      icon: Award,
      color: "from-amber-500 to-amber-600",
    },
    {
      label: isAr ? "العملاء الفريدون" : "Unique Customers",
      value: (data?.totalCustomers ?? 0).toLocaleString(),
      sub: isAr ? "بناءً على رقم الهاتف" : "by phone number",
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">{isAr ? "جاري تحميل التحليلات..." : "Loading analytics..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl">{isAr ? "التحليلات" : "Analytics"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "أرقام حقيقية من قاعدة البيانات" : "Real numbers from your database"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-muted rounded-lg p-1">
            {(["7d", "14d", "30d", "90d"] as Preset[]).map((r) => (
              <button key={r} onClick={() => applyPreset(r)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors",
                  preset === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {r}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2", preset === "custom" && "border-primary text-primary")}>
                <CalendarIcon className="h-4 w-4" />
                {format(from, "dd MMM", { locale: isAr ? arLocale : undefined })} – {format(to, "dd MMM yyyy", { locale: isAr ? arLocale : undefined })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from, to }}
                onSelect={(r: any) => {
                  if (r?.from) setFrom(r.from);
                  if (r?.to) setTo(r.to);
                  if (r?.from && r?.to) setPreset("custom");
                }}
                numberOfMonths={2}
                locale={isAr ? arLocale : undefined}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-card-soft relative overflow-hidden">
            <div className={`absolute -top-6 -end-6 h-20 w-20 rounded-full bg-gradient-to-br ${k.color} opacity-10`} />
            <div className="flex items-start justify-between mb-2">
              <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${k.color} text-white`}>
                <k.icon className="h-4 w-4" />
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="font-display font-black text-xl mt-0.5">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Sales trend + status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <h2 className="font-display font-bold text-lg mb-4">{isAr ? "اتجاه المبيعات والإيرادات" : "Revenue & orders trend"}</h2>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              {isAr ? "لا توجد بيانات في هذه الفترة" : "No data in this period"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad-sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#98040c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#98040c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-orders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#98040c" strokeWidth={2.5} fillOpacity={1} fill="url(#grad-sales)" name={isAr ? "المبيعات (ج.م)" : "Sales (EGP)"} />
                <Area type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#grad-orders)" name={isAr ? "الطلبات" : "Orders"} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <h2 className="font-display font-bold text-lg mb-4">{isAr ? "حالات الطلبات" : "Order status"}</h2>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              {isAr ? "لا توجد طلبات بعد" : "No orders yet"}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3}>
                    {statusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{s.name}</span>
                    </div>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top products + Payment */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">{isAr ? "الأكثر مبيعاً" : "Top products"}</h2>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {isAr ? "لا توجد مبيعات بعد" : "No sales yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{isAr ? p.title_ar : (p.title_en || p.title_ar)}</div>
                    <div className="text-xs text-muted-foreground">{p.units} {isAr ? "وحدة" : "units"}</div>
                  </div>
                  <div className="font-bold text-primary text-sm shrink-0">{formatPrice(p.revenue, locale)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <h2 className="font-display font-bold text-lg mb-4">{isAr ? "طرق الدفع" : "Payment methods"}</h2>
          {paymentData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {isAr ? "لا توجد بيانات" : "No data yet"}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart innerRadius={30} outerRadius={90} data={paymentData} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value">
                    {paymentData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </RadialBar>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {paymentData.map((p: any, i: number) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{p.name}</span>
                    </div>
                    <span className="font-semibold">{formatPrice(p.value, locale)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hourly + Cities */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <h2 className="font-display font-bold text-lg mb-4">{isAr ? "الطلبات حسب ساعات اليوم" : "Orders by hour of day"}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={2} />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} name={isAr ? "الطلبات" : "Orders"} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {isAr ? "أعلى المحافظات" : "Top cities"}
          </h2>
          {topCities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {isAr ? "لا توجد بيانات" : "No data yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {topCities.map((c: any, i: number) => {
                const max = topCities[0].revenue;
                const pct = Math.round((c.revenue / max) * 100);
                return (
                  <div key={c.city} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">#{i + 1} {c.city}</span>
                      <span className="text-primary font-bold">{formatPrice(c.revenue, locale)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground">{c.orders} {isAr ? "طلب" : "orders"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
