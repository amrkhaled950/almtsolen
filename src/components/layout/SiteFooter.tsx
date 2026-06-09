import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Twitter, Send, ShieldCheck, Truck, CreditCard, Headphones } from "lucide-react";
import { useLocale, t } from "../../lib/i18n";
import logoAsset from "../../assets/logo.png.asset.json";

export function SiteFooter() {
  const locale = useLocale((s) => s.locale);

  const cols = [
    {
      title: t("footer.quickLinks", locale),
      links: [
        { label: t("nav.shop", locale), to: "/shop" },
        { label: t("nav.categories", locale), to: "/categories" },
        { label: locale === "ar" ? "الأكثر مبيعاً" : "Best sellers", to: "/shop" },
        { label: locale === "ar" ? "وصل حديثاً" : "New arrivals", to: "/shop" },
      ],
    },
    {
      title: t("footer.help", locale),
      links: [
        { label: locale === "ar" ? "الشحن والتوصيل" : "Shipping", to: "/shipping" },
        { label: locale === "ar" ? "الاسترجاع" : "Returns", to: "/returns" },
        { label: locale === "ar" ? "الأسئلة الشائعة" : "FAQ", to: "/faq" },
        { label: locale === "ar" ? "تتبع الطلب" : "Track order", to: "/account" },
      ],
    },
    {
      title: t("footer.contact", locale),
      links: [
        { label: t("nav.about", locale), to: "/about" },
        { label: t("nav.contact", locale), to: "/contact" },
        { label: locale === "ar" ? "سياسة الخصوصية" : "Privacy", to: "/privacy" },
        { label: locale === "ar" ? "الشروط والأحكام" : "Terms", to: "/terms" },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-card">
      {/* Trust bar */}
      <div className="border-b border-border bg-muted/40">
        <div className="container-page grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
          {[
            { icon: Truck, label: t("trust.shipping", locale) },
            { icon: CreditCard, label: t("trust.cod", locale) },
            { icon: ShieldCheck, label: t("trust.payment", locale) },
            { icon: Headphones, label: t("trust.support", locale) },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="container-page py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="مكتبة المتسولين" className="h-14 w-14 object-contain" />
            <div>
              <div className="font-display font-extrabold text-lg leading-none text-primary">
                {locale === "ar" ? "مكتبة المتسولين" : "Al-Motasawelin Library"}
              </div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
                {locale === "ar" ? "للكتب العربية" : "Arabic Books"}
              </div>
            </div>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">
            {t("footer.tagline", locale)}
          </p>

          {/* Newsletter */}
          <div className="mt-6">
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={t("newsletter.placeholder", locale)}
                className="flex-1 h-10 px-3 rounded-md bg-background border border-input focus:border-primary focus:outline-none text-sm"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                {t("newsletter.subscribe", locale)}
              </button>
            </form>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2 mt-6">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="font-display font-bold mb-4 text-foreground">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4 py-6 text-xs text-muted-foreground">
          <div>
            © {new Date().getFullYear()} {locale === "ar" ? "المتسولين للكتب" : "Al-Mutasawilein Books"} — {t("footer.rights", locale)}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-muted font-semibold">VISA</span>
            <span className="px-2 py-1 rounded bg-muted font-semibold">Mastercard</span>
            <span className="px-2 py-1 rounded bg-muted font-semibold">Fawry</span>
            <span className="px-2 py-1 rounded bg-muted font-semibold">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
