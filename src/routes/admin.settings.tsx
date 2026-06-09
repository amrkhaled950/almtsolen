import { createFileRoute } from "@tanstack/react-router";
import { Store, CreditCard, Truck, Bell, Globe, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { getShippingRates, upsertShippingRates, type GovernorateShipping } from "@/lib/shipping.functions";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings.functions";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Tab = "store" | "shipping" | "payment" | "notifications";

function SettingsPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const [tab, setTab] = useState<Tab>("store");

  const tabs: { id: Tab; label: { ar: string; en: string }; icon: any }[] = [
    { id: "store",         label: { ar: "المتجر",      en: "Store" },         icon: Store },
    { id: "shipping",      label: { ar: "الشحن",       en: "Shipping" },      icon: Truck },
    { id: "payment",       label: { ar: "الدفع",       en: "Payment" },       icon: CreditCard },
    { id: "notifications", label: { ar: "الإشعارات",   en: "Notifications" }, icon: Bell },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl">{isAr ? "الإعدادات" : "Settings"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "إدارة إعدادات المتجر" : "Manage your store settings"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {isAr ? t.label.ar : t.label.en}
          </button>
        ))}
      </div>

      {tab === "store"         && <StoreTab isAr={isAr} />}
      {tab === "shipping"      && <ShippingTab isAr={isAr} />}
      {tab === "payment"       && <PaymentTab isAr={isAr} />}
      {tab === "notifications" && <NotificationsTab isAr={isAr} />}
    </div>
  );
}

/* ── Store Tab ─────────────────────────────────────────── */
function StoreTab({ isAr }: { isAr: boolean }) {
  const fetchSettings = useServerFn(getSiteSettings);
  const updateFn = useServerFn(updateSiteSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
  });

  const s = data?.settings;
  const [form, setForm] = useState<Record<string, string>>({});
  const f = (key: string) => (form[key] !== undefined ? form[key] : (s as any)?.[key] ?? "");

  const mut = useMutation({
    mutationFn: () => updateFn({ data: Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null])) as any }),
    onSuccess: () => { toast.success(isAr ? "تم الحفظ" : "Saved"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const fields = [
    { key: "site_name_ar", label: { ar: "اسم المتجر (عربي)", en: "Store name (Arabic)" } },
    { key: "site_name_en", label: { ar: "اسم المتجر (إنجليزي)", en: "Store name (English)" } },
    { key: "contact_phone", label: { ar: "رقم الهاتف", en: "Phone" } },
    { key: "contact_email", label: { ar: "البريد الإلكتروني", en: "Email" } },
    { key: "contact_address_ar", label: { ar: "العنوان (عربي)", en: "Address (Arabic)" } },
    { key: "social_whatsapp", label: { ar: "رقم واتساب", en: "WhatsApp number" } },
    { key: "social_instagram", label: { ar: "Instagram", en: "Instagram" } },
    { key: "social_facebook", label: { ar: "Facebook", en: "Facebook" } },
    { key: "social_tiktok", label: { ar: "TikTok", en: "TikTok" } },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {isAr ? field.label.ar : field.label.en}
            </label>
            <input
              value={f(field.key)}
              onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-2 disabled:opacity-60"
        >
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isAr ? "حفظ" : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ── Shipping Tab ──────────────────────────────────────── */
function ShippingTab({ isAr }: { isAr: boolean }) {
  const fetchRates = useServerFn(getShippingRates);
  const upsertFn = useServerFn(upsertShippingRates);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["shipping-rates"],
    queryFn: () => fetchRates(),
  });

  const [rates, setRates] = useState<GovernorateShipping[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    setRates(data.rates);
    setInitialized(true);
  }

  const setRate = (i: number, key: keyof GovernorateShipping, val: any) => {
    setRates((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  };

  const mut = useMutation({
    mutationFn: () => upsertFn({ data: { rates } }),
    onSuccess: () => { toast.success(isAr ? "تم حفظ أسعار الشحن" : "Shipping rates saved"); qc.invalidateQueries({ queryKey: ["shipping-rates"] }); },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const totalEnabled = rates.filter((r) => r.enabled).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold">{isAr ? "أسعار الشحن بالمحافظة" : "Shipping rates by governorate"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? `${totalEnabled} محافظة مفعّلة` : `${totalEnabled} governorates enabled`}
            </p>
          </div>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-2 disabled:opacity-60"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isAr ? "حفظ الكل" : "Save all"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "المحافظة" : "Governorate"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "سعر الشحن (ج.م)" : "Shipping price (EGP)"}</th>
                <th className="text-center px-4 py-3 font-semibold">{isAr ? "مفعّل" : "Enabled"}</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={r.governorate_en} className={`border-t border-border ${!r.enabled ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5 font-medium">
                    {isAr ? r.governorate_ar : r.governorate_en}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      value={r.price}
                      onChange={(e) => setRate(i, "price", Number(e.target.value))}
                      className="w-28 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => setRate(i, "enabled", !r.enabled)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${r.enabled ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 ${r.enabled ? "end-0.5" : "start-0.5"} h-5 w-5 rounded-full bg-white shadow transition-all`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Tab ───────────────────────────────────────── */
function PaymentTab({ isAr }: { isAr: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
      <h2 className="font-bold text-lg">{isAr ? "طرق الدفع" : "Payment methods"}</h2>
      {[
        { label: { ar: "الدفع عند الاستلام", en: "Cash on delivery" }, enabled: true },
        { label: { ar: "Paymob - بطاقات", en: "Paymob - Cards" }, enabled: false },
        { label: { ar: "Paymob - محافظ", en: "Paymob - Wallets" }, enabled: false },
      ].map((t) => (
        <div key={t.label.en} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span className="text-sm font-medium">{isAr ? t.label.ar : t.label.en}</span>
          <button className={`relative h-6 w-11 rounded-full transition-colors ${t.enabled ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 ${t.enabled ? "end-0.5" : "start-0.5"} h-5 w-5 rounded-full bg-white shadow`} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Notifications Tab ─────────────────────────────────── */
function NotificationsTab({ isAr }: { isAr: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
      <h2 className="font-bold text-lg">{isAr ? "الإشعارات" : "Notifications"}</h2>
      {[
        { label: { ar: "إشعار بريد طلب جديد", en: "New order email" }, enabled: true },
        { label: { ar: "SMS لتحديثات الطلب", en: "SMS order updates" }, enabled: false },
      ].map((t) => (
        <div key={t.label.en} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span className="text-sm font-medium">{isAr ? t.label.ar : t.label.en}</span>
          <button className={`relative h-6 w-11 rounded-full transition-colors ${t.enabled ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 ${t.enabled ? "end-0.5" : "start-0.5"} h-5 w-5 rounded-full bg-white shadow`} />
          </button>
        </div>
      ))}
    </div>
  );
}
