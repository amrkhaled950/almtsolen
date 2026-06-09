import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLocale, formatPrice } from "../lib/i18n";
import { useCart } from "../lib/cart-store";
import { EG_GOVERNORATES, EG_PHONE_REGEX } from "../lib/governorates";
import { placeOrder } from "../lib/orders.functions";
import { getShippingRates } from "../lib/shipping.functions";
import { validateCoupon, type CouponPreview } from "../lib/coupons.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "إتمام الشراء | المتسولين" }] }),
  component: Checkout,
});

function Checkout() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const closeCart = useCart((s) => s.closeCart);
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const fetchRatesFn = useServerFn(getShippingRates);

  const { data: ratesData } = useQuery({
    queryKey: ["shipping-rates"],
    queryFn: () => fetchRatesFn(),
  });

  const getShippingPrice = () => {
    if (subtotal >= 2000) return 0;
    if (!form.governorate || !ratesData?.rates.length) return 50;
    const match = ratesData.rates.find(
      (r) => r.governorate_ar === form.governorate || r.governorate_en === form.governorate
    );
    return match?.enabled ? match.price : 50;
  };

  const shipping = getShippingPrice();
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    governorate: "",
    city: "",
    street: "",
    building: "",
    apartment: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ order_number: string } | null>(null);

  const setField = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = isAr ? "الاسم مطلوب" : "Name required";
    if (!EG_PHONE_REGEX.test(form.phone.trim()))
      e.phone = isAr ? "رقم غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقمًا" : "Invalid Egyptian phone";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = isAr ? "بريد غير صحيح" : "Invalid email";
    if (!form.governorate) e.governorate = isAr ? "اختر المحافظة" : "Select governorate";
    if (form.city.trim().length < 2) e.city = isAr ? "المدينة مطلوبة" : "City required";
    if (form.street.trim().length < 2) e.street = isAr ? "العنوان مطلوب" : "Street required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(isAr ? "تأكد من البيانات المدخلة" : "Please check the form");
      return;
    }
    if (items.length === 0) return;
    setBusy(true);
    try {
      const res = await placeOrderFn({
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          governorate: form.governorate,
          city: form.city.trim(),
          street: form.street.trim(),
          building: form.building.trim() || undefined,
          apartment: form.apartment.trim() || undefined,
          notes: form.notes.trim() || undefined,
          payment_method: "cod",
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        },
      });
      setSuccess({ order_number: res.order_number });
      clear();
      closeCart();
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "تعذّر إنشاء الطلب" : "Could not place order"));
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div className="container-page py-20">
        <div className="max-w-md mx-auto text-center bg-card border border-border rounded-3xl p-10 shadow-elegant">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-success/10 text-success mb-4">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="font-display font-black text-2xl mb-2">
            {isAr ? "تم استلام طلبك بنجاح!" : "Order received!"}
          </h1>
          <p className="text-muted-foreground mb-1">
            {isAr ? "رقم الطلب" : "Order number"}
          </p>
          <p className="font-display font-bold text-2xl text-primary mb-6">{success.order_number}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {isAr
              ? "سنتواصل معك على الرقم الذي أدخلته لتأكيد الطلب وتحديد موعد التوصيل."
              : "We'll call you to confirm and schedule delivery."}
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/shop" className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover">
              {isAr ? "متابعة التسوق" : "Continue shopping"}
            </Link>
            <Link to="/account" className="h-11 px-5 rounded-lg border border-input bg-background font-semibold hover:bg-muted">
              {isAr ? "حسابي" : "My account"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-muted-foreground mb-4">{isAr ? "سلتك فارغة" : "Cart is empty"}</p>
        <Link to="/shop" className="text-primary font-semibold">{isAr ? "تسوّق الآن" : "Shop now"}</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display font-black text-3xl md:text-4xl mb-8">
        {isAr ? "إتمام الشراء" : "Checkout"}
      </h1>
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-xl mb-2">
            {isAr ? "معلومات الشحن" : "Shipping info"}
          </h2>

          <Field label={isAr ? "الاسم بالكامل *" : "Full name *"} error={errors.full_name}>
            <input value={form.full_name} onChange={(e) => setField("full_name", e.target.value)}
              className="w-full h-12 px-4 rounded-md border border-input bg-background" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={isAr ? "رقم الهاتف *" : "Phone *"} error={errors.phone}>
              <input inputMode="numeric" maxLength={11}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="01012345678"
                className="w-full h-12 px-4 rounded-md border border-input bg-background" />
            </Field>
            <Field label={isAr ? "البريد الإلكتروني (اختياري)" : "Email (optional)"} error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)}
                className="w-full h-12 px-4 rounded-md border border-input bg-background" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={isAr ? "المحافظة *" : "Governorate *"} error={errors.governorate}>
              <select value={form.governorate} onChange={(e) => setField("governorate", e.target.value)}
                className="w-full h-12 px-3 rounded-md border border-input bg-background">
                <option value="">{isAr ? "— اختر المحافظة —" : "— Select —"}</option>
                {EG_GOVERNORATES.map((g) => (
                  <option key={g.en} value={isAr ? g.ar : g.en}>{isAr ? g.ar : g.en}</option>
                ))}
              </select>
            </Field>
            <Field label={isAr ? "المدينة / المنطقة *" : "City *"} error={errors.city}>
              <input value={form.city} onChange={(e) => setField("city", e.target.value)}
                className="w-full h-12 px-4 rounded-md border border-input bg-background" />
            </Field>
          </div>

          <Field label={isAr ? "العنوان (الشارع) *" : "Street *"} error={errors.street}>
            <input value={form.street} onChange={(e) => setField("street", e.target.value)}
              className="w-full h-12 px-4 rounded-md border border-input bg-background" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={isAr ? "العمارة (اختياري)" : "Building (optional)"}>
              <input value={form.building} onChange={(e) => setField("building", e.target.value)}
                className="w-full h-12 px-4 rounded-md border border-input bg-background" />
            </Field>
            <Field label={isAr ? "الشقة (اختياري)" : "Apartment (optional)"}>
              <input value={form.apartment} onChange={(e) => setField("apartment", e.target.value)}
                className="w-full h-12 px-4 rounded-md border border-input bg-background" />
            </Field>
          </div>

          <Field label={isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}>
            <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-md border border-input bg-background" />
          </Field>

          <h2 className="font-display font-bold text-xl mt-6 mb-2">
            {isAr ? "طريقة الدفع" : "Payment"}
          </h2>
          <label className="flex items-center gap-3 p-4 border border-primary bg-primary/5 rounded-md cursor-pointer">
            <input type="radio" name="pay" defaultChecked readOnly />
            <span className="font-semibold">{isAr ? "الدفع عند الاستلام" : "Cash on delivery"}</span>
          </label>
          <label className="flex items-center gap-3 p-4 border border-border rounded-md cursor-not-allowed opacity-60">
            <input type="radio" name="pay" disabled />
            <span>{isAr ? "بطاقة ائتمان (قريباً مع Paymob)" : "Card (Paymob — soon)"}</span>
          </label>

          <button type="submit" disabled={busy}
            className="w-full h-14 mt-4 rounded-md bg-primary text-primary-foreground font-bold text-lg hover:bg-primary-hover shadow-elegant disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {isAr ? `تأكيد الطلب — ${formatPrice(total, locale)}` : `Place order — ${formatPrice(total, locale)}`}
          </button>
        </form>

        <aside className="bg-card border border-border rounded-2xl p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display font-bold text-xl mb-4">
            {isAr ? "ملخص الطلب" : "Order summary"}
          </h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {items.map((i) => {
              const title = isAr ? i.product.title_ar : i.product.title_en;
              return (
                <div key={i.product.id} className="flex gap-3">
                  <img src={i.product.cover_url ?? ""} className="h-16 w-12 object-cover rounded bg-muted" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{title}</p>
                    <p className="text-xs text-muted-foreground">×{i.quantity}</p>
                  </div>
                  <span className="text-sm font-bold">{formatPrice(Number(i.product.price) * i.quantity, locale)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <Row label={isAr ? "المجموع الفرعي" : "Subtotal"} value={formatPrice(subtotal, locale)} />
            <Row label={isAr ? "الشحن" : "Shipping"} value={shipping === 0 ? (isAr ? "مجاناً" : "Free") : formatPrice(shipping, locale)} />
            <div className="flex justify-between text-lg pt-3 border-t border-border">
              <span className="font-bold">{isAr ? "الإجمالي" : "Total"}</span>
              <span className="font-display font-black text-primary">{formatPrice(total, locale)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
