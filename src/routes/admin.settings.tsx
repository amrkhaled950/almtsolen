import { createFileRoute } from "@tanstack/react-router";
import {
  Palette, Image as ImageIcon, Share2, FileText, Truck, CreditCard, Bell,
  Loader2, Check, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Megaphone,
  LayoutGrid,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { getShippingRates, upsertShippingRates, type GovernorateShipping } from "@/lib/shipping.functions";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/site-settings.functions";
import { listCategoriesPublic } from "@/lib/catalog.functions";
import { parseHomeSections, serializeHomeSections, type HomeSection } from "@/lib/home-sections";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Tab = "branding" | "hero" | "home" | "promo" | "social" | "footer" | "legal" | "shipping" | "payment" | "notifications";

function SettingsPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const [tab, setTab] = useState<Tab>("branding");

  const tabs: { id: Tab; label: { ar: string; en: string }; icon: any }[] = [
    { id: "branding",      label: { ar: "العلامة التجارية", en: "Branding" },      icon: Palette },
    { id: "hero",          label: { ar: "البانر الرئيسي",   en: "Hero" },          icon: ImageIcon },
    { id: "home",          label: { ar: "أقسام الرئيسية",   en: "Home Sections" }, icon: LayoutGrid },
    { id: "promo",         label: { ar: "العروض والإعلانات", en: "Promo & Banner" }, icon: Megaphone },
    { id: "social",        label: { ar: "التواصل والسوشيال", en: "Contact & Social" }, icon: Share2 },
    { id: "footer",        label: { ar: "الفوتر",          en: "Footer" },        icon: FileText },
    { id: "legal",         label: { ar: "الصفحات القانونية", en: "Legal Pages" },  icon: FileText },
    { id: "shipping",      label: { ar: "الشحن",          en: "Shipping" },      icon: Truck },
    { id: "payment",       label: { ar: "الدفع",          en: "Payment" },       icon: CreditCard },
    { id: "notifications", label: { ar: "الإشعارات",       en: "Notifications" }, icon: Bell },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl">{isAr ? "الإعدادات" : "Settings"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? "إدارة محتوى وإعدادات المتجر" : "Manage store content and settings"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {isAr ? t.label.ar : t.label.en}
          </button>
        ))}
      </div>

      {tab === "branding"      && <SettingsForm isAr={isAr} render={(s, set, save, saving) => <BrandingTab isAr={isAr} s={s} set={set} save={save} saving={saving} />} />}
      {tab === "hero"          && <SettingsForm isAr={isAr} render={(s, set, save, saving) => <HeroTab isAr={isAr} s={s} set={set} save={save} saving={saving} />} />}
      {tab === "promo"         && <SettingsForm isAr={isAr} render={(s, set, save, saving) => <PromoTab isAr={isAr} s={s} set={set} save={save} saving={saving} />} />}
      {tab === "social"        && <SettingsForm isAr={isAr} render={(s, set, save, saving) => <SocialTab isAr={isAr} s={s} set={set} save={save} saving={saving} />} />}
      {tab === "footer"        && <SettingsForm isAr={isAr} render={(s, set, save, saving) => <FooterTab isAr={isAr} s={s} set={set} save={save} saving={saving} />} />}
      {tab === "legal"         && <SettingsForm isAr={isAr} render={(s, set, save, saving) => <LegalTab isAr={isAr} s={s} set={set} save={save} saving={saving} />} />}
      {tab === "shipping"      && <ShippingTab isAr={isAr} />}
      {tab === "payment"       && <PaymentTab isAr={isAr} />}
      {tab === "notifications" && <NotificationsTab isAr={isAr} />}
    </div>
  );
}

/* ── Settings form wrapper (shared data + save) ─────────── */
type FormState = Partial<SiteSettings>;
type RenderFn = (
  s: FormState,
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K] | null) => void,
  save: () => void,
  saving: boolean,
) => React.ReactNode;

function SettingsForm({ isAr, render }: { isAr: boolean; render: RenderFn }) {
  const fetchSettings = useServerFn(getSiteSettings);
  const updateFn = useServerFn(updateSiteSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
  });

  const [form, setForm] = useState<FormState>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K] | null) => {
    setForm((p) => ({ ...p, [key]: value as any }));
    setTouched((p) => new Set(p).add(key as string));
  };

  const mut = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      touched.forEach((k) => {
        const v = (form as any)[k];
        payload[k] = v === "" ? null : v;
      });
      return updateFn({ data: payload as any });
    },
    onSuccess: () => {
      toast.success(isAr ? "تم الحفظ" : "Saved");
      setTouched(new Set());
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <>{render(form, set, () => mut.mutate(), mut.isPending)}</>;
}

/* ── Inputs ─────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function TextInput({ value, onChange, type = "text", placeholder }: { value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary"
    />
  );
}
function TextArea({ value, onChange, rows = 4, placeholder }: { value: any; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary resize-y"
    />
  );
}
function SaveBar({ onSave, saving, isAr }: { onSave: () => void; saving: boolean; isAr: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {isAr ? "حفظ التغييرات" : "Save changes"}
      </button>
    </div>
  );
}
function ImagePreview({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <img src={url} alt="" className="h-16 w-16 object-contain rounded-md border border-border bg-muted/30" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />{url.length > 50 ? url.slice(0, 50) + "..." : url}</a>
    </div>
  );
}

/* ── Branding Tab ───────────────────────────────────────── */
function BrandingTab({ isAr, s, set, save, saving }: { isAr: boolean; s: FormState; set: any; save: () => void; saving: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={isAr ? "اللوجو" : "Logo"}>
          <ImageUpload value={s.logo_url} onChange={(v) => set("logo_url", v)} folder="branding" />
        </Field>
        <Field label={isAr ? "أيقونة الموقع (Favicon)" : "Favicon"}>
          <ImageUpload value={s.favicon_url} onChange={(v) => set("favicon_url", v)} folder="branding" size={64} accept="image/png,image/x-icon,image/svg+xml" />
        </Field>
        <Field label={isAr ? "اسم الموقع (عربي)" : "Site name (Arabic)"}>
          <TextInput value={s.site_name_ar} onChange={(v) => set("site_name_ar", v)} />
        </Field>
        <Field label={isAr ? "اسم الموقع (إنجليزي)" : "Site name (English)"}>
          <TextInput value={s.site_name_en} onChange={(v) => set("site_name_en", v)} />
        </Field>
        <Field label={isAr ? "الشعار التعريفي (عربي)" : "Tagline (Arabic)"}>
          <TextInput value={s.tagline_ar} onChange={(v) => set("tagline_ar", v)} />
        </Field>
        <Field label={isAr ? "الشعار التعريفي (إنجليزي)" : "Tagline (English)"}>
          <TextInput value={s.tagline_en} onChange={(v) => set("tagline_en", v)} />
        </Field>
        <Field label={isAr ? "وصف SEO (عربي)" : "Meta description (Arabic)"}>
          <TextArea value={s.meta_description_ar} onChange={(v) => set("meta_description_ar", v)} rows={3} />
        </Field>
        <Field label={isAr ? "وصف SEO (إنجليزي)" : "Meta description (English)"}>
          <TextArea value={s.meta_description_en} onChange={(v) => set("meta_description_en", v)} rows={3} />
        </Field>
      </div>
      <SaveBar onSave={save} saving={saving} isAr={isAr} />
    </div>
  );
}

/* ── Hero Tab ───────────────────────────────────────────── */
function HeroTab({ isAr, s, set, save, saving }: { isAr: boolean; s: FormState; set: any; save: () => void; saving: boolean }) {
  const images = s.hero_images || [];
  const updateImages = (next: typeof images) => set("hero_images", next);
  const updateImage = (i: number, patch: Partial<(typeof images)[0]>) => updateImages(images.map((img, idx) => idx === i ? { ...img, ...patch } : img));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    updateImages(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
        <h3 className="font-bold">{isAr ? "نصوص البانر" : "Hero text"}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={isAr ? "العنوان (عربي)" : "Title (Arabic)"}>
            <TextInput value={s.hero_title_ar} onChange={(v) => set("hero_title_ar", v)} />
          </Field>
          <Field label={isAr ? "العنوان (إنجليزي)" : "Title (English)"}>
            <TextInput value={s.hero_title_en} onChange={(v) => set("hero_title_en", v)} />
          </Field>
          <Field label={isAr ? "العنوان الفرعي (عربي)" : "Subtitle (Arabic)"}>
            <TextArea value={s.hero_subtitle_ar} onChange={(v) => set("hero_subtitle_ar", v)} rows={2} />
          </Field>
          <Field label={isAr ? "العنوان الفرعي (إنجليزي)" : "Subtitle (English)"}>
            <TextArea value={s.hero_subtitle_en} onChange={(v) => set("hero_subtitle_en", v)} rows={2} />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">{isAr ? "صور البانر" : "Hero images"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{isAr ? `${images.length} صورة` : `${images.length} images`}</p>
          </div>
          <button
            onClick={() => updateImages([...images, { url: "" }])}
            className="h-9 px-3 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />{isAr ? "إضافة صورة" : "Add image"}
          </button>
        </div>
        {images.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "لا توجد صور — اضغط إضافة" : "No images yet"}</p>
        )}
        {images.map((img, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === images.length - 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => updateImages(images.filter((_, idx) => idx !== i))} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <Field label={isAr ? "الصورة" : "Image"}>
              <ImageUpload value={img.url} onChange={(v) => updateImage(i, { url: v })} folder="hero" size={120} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={isAr ? "العنوان (عربي)" : "Title (Arabic)"}>
                <TextInput value={img.title_ar} onChange={(v) => updateImage(i, { title_ar: v })} />
              </Field>
              <Field label={isAr ? "العنوان (إنجليزي)" : "Title (English)"}>
                <TextInput value={img.title_en} onChange={(v) => updateImage(i, { title_en: v })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={isAr ? "الرابط عند الضغط (اختياري)" : "Click link (optional)"}>
                  <TextInput value={img.link} onChange={(v) => updateImage(i, { link: v })} placeholder="/shop" />
                </Field>
              </div>
            </div>
          </div>
        ))}
        <SaveBar onSave={save} saving={saving} isAr={isAr} />
      </div>
    </div>
  );
}

/* ── Social & Contact Tab ───────────────────────────────── */
function SocialTab({ isAr, s, set, save, saving }: { isAr: boolean; s: FormState; set: any; save: () => void; saving: boolean }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
        <h3 className="font-bold">{isAr ? "بيانات التواصل" : "Contact info"}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={isAr ? "الهاتف" : "Phone"}><TextInput value={s.contact_phone} onChange={(v) => set("contact_phone", v)} /></Field>
          <Field label={isAr ? "البريد الإلكتروني" : "Email"}><TextInput value={s.contact_email} onChange={(v) => set("contact_email", v)} type="email" /></Field>
          <Field label={isAr ? "العنوان (عربي)" : "Address (Arabic)"}><TextArea value={s.contact_address_ar} onChange={(v) => set("contact_address_ar", v)} rows={2} /></Field>
          <Field label={isAr ? "العنوان (إنجليزي)" : "Address (English)"}><TextArea value={s.contact_address_en} onChange={(v) => set("contact_address_en", v)} rows={2} /></Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
        <h3 className="font-bold">{isAr ? "روابط السوشيال ميديا" : "Social media"}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Facebook"><TextInput value={s.social_facebook} onChange={(v) => set("social_facebook", v)} placeholder="https://facebook.com/..." /></Field>
          <Field label="Instagram"><TextInput value={s.social_instagram} onChange={(v) => set("social_instagram", v)} placeholder="https://instagram.com/..." /></Field>
          <Field label="Twitter / X"><TextInput value={s.social_twitter} onChange={(v) => set("social_twitter", v)} placeholder="https://x.com/..." /></Field>
          <Field label="TikTok"><TextInput value={s.social_tiktok} onChange={(v) => set("social_tiktok", v)} placeholder="https://tiktok.com/@..." /></Field>
          <Field label="YouTube"><TextInput value={s.social_youtube} onChange={(v) => set("social_youtube", v)} placeholder="https://youtube.com/@..." /></Field>
          <Field label={isAr ? "رقم واتساب" : "WhatsApp number"}><TextInput value={s.social_whatsapp} onChange={(v) => set("social_whatsapp", v)} placeholder="201xxxxxxxxx" /></Field>
        </div>
        <SaveBar onSave={save} saving={saving} isAr={isAr} />
      </div>
    </div>
  );
}

/* ── Footer Tab ─────────────────────────────────────────── */
function FooterTab({ isAr, s, set, save, saving }: { isAr: boolean; s: FormState; set: any; save: () => void; saving: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
      <h3 className="font-bold">{isAr ? "نص عن المتجر (يظهر في الفوتر)" : "About text (shown in footer)"}</h3>
      <div className="grid gap-4">
        <Field label={isAr ? "النص (عربي)" : "Text (Arabic)"}>
          <TextArea value={s.footer_about_ar} onChange={(v) => set("footer_about_ar", v)} rows={4} />
        </Field>
        <Field label={isAr ? "النص (إنجليزي)" : "Text (English)"}>
          <TextArea value={s.footer_about_en} onChange={(v) => set("footer_about_en", v)} rows={4} />
        </Field>
      </div>
      <SaveBar onSave={save} saving={saving} isAr={isAr} />
    </div>
  );
}

/* ── Legal / Policy pages Tab ───────────────────────────── */
function LegalTab({ isAr, s, set, save, saving }: { isAr: boolean; s: FormState; set: any; save: () => void; saving: boolean }) {
  const sections: { keyAr: keyof SiteSettings; keyEn: keyof SiteSettings; label: { ar: string; en: string } }[] = [
    { keyAr: "privacy_policy_ar",   keyEn: "privacy_policy_en",   label: { ar: "سياسة الخصوصية", en: "Privacy Policy" } },
    { keyAr: "terms_ar",            keyEn: "terms_en",            label: { ar: "الشروط والأحكام", en: "Terms & Conditions" } },
    { keyAr: "refund_policy_ar",    keyEn: "refund_policy_en",    label: { ar: "سياسة الاسترجاع", en: "Refund Policy" } },
    { keyAr: "shipping_policy_ar",  keyEn: "shipping_policy_en",  label: { ar: "سياسة الشحن", en: "Shipping Policy" } },
    { keyAr: "about_ar",            keyEn: "about_en",            label: { ar: "عن المتجر", en: "About Us" } },
  ];

  const [open, setOpen] = useState<string>(sections[0].keyAr as string);

  return (
    <div className="space-y-3">
      {sections.map((sec) => {
        const isOpen = open === (sec.keyAr as string);
        return (
          <div key={sec.keyAr as string} className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? "" : (sec.keyAr as string))}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30"
            >
              <span className="font-bold">{isAr ? sec.label.ar : sec.label.en}</span>
              <span className="text-xs text-muted-foreground">{isOpen ? (isAr ? "إخفاء" : "Hide") : (isAr ? "تعديل" : "Edit")}</span>
            </button>
            {isOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                <Field label={isAr ? "المحتوى (عربي)" : "Content (Arabic)"}>
                  <TextArea value={(s as any)[sec.keyAr]} onChange={(v) => set(sec.keyAr, v)} rows={10} />
                </Field>
                <Field label={isAr ? "المحتوى (إنجليزي)" : "Content (English)"}>
                  <TextArea value={(s as any)[sec.keyEn]} onChange={(v) => set(sec.keyEn, v)} rows={10} />
                </Field>
              </div>
            )}
          </div>
        );
      })}
      <SaveBar onSave={save} saving={saving} isAr={isAr} />
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
                  <td className="px-4 py-2.5 font-medium">{isAr ? r.governorate_ar : r.governorate_en}</td>
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

/* ── Promo & Announcement Tab ──────────────────────────── */
function PromoTab({ isAr, s, set, save, saving }: { isAr: boolean; s: FormState; set: any; save: () => void; saving: boolean }) {
  const cs = s.custom_strings || {};
  const get = (key: string, lang: "ar" | "en") => cs[key]?.[lang] ?? "";
  const setCs = (key: string, lang: "ar" | "en", value: string) => {
    const next = { ...(s.custom_strings || {}) };
    next[key] = { ...(next[key] || {}), [lang]: value };
    set("custom_strings", next);
  };
  const promoEnabled = (cs["promo_enabled"]?.ar ?? "") === "1";
  const toggleEnabled = (on: boolean) => setCs("promo_enabled", "ar", on ? "1" : "");

  return (
    <div className="space-y-4">
      {/* Announcement Bar */}
      <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
        <div>
          <h3 className="font-bold">{isAr ? "شريط الإعلانات العلوي" : "Top announcement bar"}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr ? "النص الذي يظهر في أعلى الموقع. اتركه فاضي لإخفاء الشريط." : "Shown at the very top of the site. Leave empty to hide."}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={isAr ? "النص (عربي)" : "Text (Arabic)"}>
            <TextInput value={get("announcement_bar", "ar")} onChange={(v) => setCs("announcement_bar", "ar", v)} placeholder="🚚 شحن مجاني للطلبات فوق 2000 ج.م" />
          </Field>
          <Field label={isAr ? "النص (إنجليزي)" : "Text (English)"}>
            <TextInput value={get("announcement_bar", "en")} onChange={(v) => setCs("announcement_bar", "en", v)} placeholder="🚚 Free shipping on orders over 2000 EGP" />
          </Field>
        </div>
      </div>

      {/* Promo Popup */}
      <div className="rounded-2xl border border-border bg-card shadow-card-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">{isAr ? "نافذة الترويج المنبثقة" : "Promo popup"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? "تظهر مرة واحدة لكل زائر." : "Shown once per visitor session."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleEnabled(!promoEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${promoEnabled ? "bg-primary" : "bg-muted"}`}
            aria-label="Toggle promo"
          >
            <span className={`absolute top-0.5 ${promoEnabled ? "end-0.5" : "start-0.5"} h-5 w-5 rounded-full bg-white shadow transition-all`} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={isAr ? "العنوان (عربي)" : "Title (Arabic)"}>
            <TextInput value={get("promo_title", "ar")} onChange={(v) => setCs("promo_title", "ar", v)} placeholder="هناك عرض خاص لك!" />
          </Field>
          <Field label={isAr ? "العنوان (إنجليزي)" : "Title (English)"}>
            <TextInput value={get("promo_title", "en")} onChange={(v) => setCs("promo_title", "en", v)} placeholder="A special offer for you!" />
          </Field>
          <Field label={isAr ? "الوصف (عربي)" : "Description (Arabic)"}>
            <TextArea value={get("promo_description", "ar")} onChange={(v) => setCs("promo_description", "ar", v)} rows={3} />
          </Field>
          <Field label={isAr ? "الوصف (إنجليزي)" : "Description (English)"}>
            <TextArea value={get("promo_description", "en")} onChange={(v) => setCs("promo_description", "en", v)} rows={3} />
          </Field>
          <Field label={isAr ? "كود الكوبون" : "Coupon code"}>
            <TextInput value={get("promo_coupon", "ar")} onChange={(v) => setCs("promo_coupon", "ar", v)} placeholder="new5" />
          </Field>
          <Field label={isAr ? "نص الزر (عربي/إنجليزي)" : "Button text (Arabic/English)"}>
            <div className="grid grid-cols-2 gap-2">
              <TextInput value={get("promo_cta", "ar")} onChange={(v) => setCs("promo_cta", "ar", v)} placeholder="متابعة التسوق" />
              <TextInput value={get("promo_cta", "en")} onChange={(v) => setCs("promo_cta", "en", v)} placeholder="Continue shopping" />
            </div>
          </Field>
        </div>
      </div>

      <SaveBar onSave={save} saving={saving} isAr={isAr} />
    </div>
  );
}
