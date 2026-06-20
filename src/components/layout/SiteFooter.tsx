import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Twitter, Send, ShieldCheck, Truck, CreditCard, Headphones, Music2, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { useLocale, t } from "../../lib/i18n";
import { useSiteSettings } from "../../lib/use-site-settings";

export function SiteFooter() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const { settings } = useSiteSettings();

  const siteName = (isAr ? settings?.site_name_ar : settings?.site_name_en) || (isAr ? "مكتبة المتسولين" : "Al-Motasawelin Library");
  const tagline = (isAr ? settings?.tagline_ar : settings?.tagline_en) || (isAr ? "للكتب العربية" : "Arabic Books");
  const aboutText = (isAr ? settings?.footer_about_ar : settings?.footer_about_en) || t("footer.tagline", locale);
  const logoUrl = settings?.logo_url || "/logo.png";
  const address = isAr ? settings?.contact_address_ar : settings?.contact_address_en;

  const socials = [
    settings?.social_facebook && { Icon: Facebook, href: settings.social_facebook },
    settings?.social_instagram && { Icon: Instagram, href: settings.social_instagram },
    settings?.social_twitter && { Icon: Twitter, href: settings.social_twitter },
    settings?.social_youtube && { Icon: Youtube, href: settings.social_youtube },
    settings?.social_tiktok && { Icon: Music2, href: settings.social_tiktok },
    settings?.social_whatsapp && { Icon: MessageCircle, href: `https://wa.me/${settings.social_whatsapp.replace(/\D/g, "")}` },
  ].filter(Boolean) as Array<{ Icon: typeof Facebook; href: string }>;

  const fallbackSocials = socials.length === 0
    ? [Facebook, Instagram, Twitter, Youtube].map((Icon) => ({ Icon, href: "#" }))
    : socials;

  const cols = [
    {
      title: t("footer.quickLinks", locale),
      links: [
        { label: t("nav.shop", locale), to: "/shop" },
        { label: t("nav.categories", locale), to: "/categories" },
        { label: isAr ? "الأكثر مبيعاً" : "Best sellers", to: "/shop" },
        { label: isAr ? "وصل حديثاً" : "New arrivals", to: "/shop" },
      ],
    },
    {
      title: t("footer.help", locale),
      links: [
        { label: isAr ? "الشحن والتوصيل" : "Shipping", to: "/shipping" },
        { label: isAr ? "الاسترجاع" : "Returns", to: "/returns" },
        { label: isAr ? "الأسئلة الشائعة" : "FAQ", to: "/contact" },
        
      ],
    },
    {
      title: t("footer.contact", locale),
      links: [
        { label: t("nav.about", locale), to: "/about" },
        { label: t("nav.contact", locale), to: "/contact" },
        { label: isAr ? "سياسة الخصوصية" : "Privacy", to: "/privacy" },
        { label: isAr ? "الشروط والأحكام" : "Terms", to: "/terms" },
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
            <img src={logoUrl} alt={siteName} className="h-14 w-14 object-contain" />
            <div>
              <div className="font-display font-extrabold text-lg leading-none text-primary">{siteName}</div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">{tagline}</div>
            </div>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm whitespace-pre-line">{aboutText}</p>

          {/* Contact info */}
          {(settings?.contact_phone || settings?.contact_email || address) && (
            <div className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              {settings?.contact_phone && (
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><a href={`tel:${settings.contact_phone}`} className="hover:text-primary">{settings.contact_phone}</a></div>
              )}
              {settings?.contact_email && (
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><a href={`mailto:${settings.contact_email}`} className="hover:text-primary">{settings.contact_email}</a></div>
              )}
              {address && (
                <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5" /><span>{address}</span></div>
              )}
            </div>
          )}

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
            {fallbackSocials.map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target={href === "#" ? undefined : "_blank"}
                rel={href === "#" ? undefined : "noopener noreferrer"}
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
            © {new Date().getFullYear()} {siteName} — {t("footer.rights", locale)}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-muted font-semibold">VISA</span>
            <span className="px-2 py-1 rounded bg-muted font-semibold">Mastercard</span>
            <span className="px-2 py-1 rounded bg-muted font-semibold">COD</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
