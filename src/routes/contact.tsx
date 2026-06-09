import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "../lib/i18n";
import { useSiteSettings } from "../lib/use-site-settings";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "تواصل معنا | المتسولين" }] }),
  component: ContactPage,
});

function ContactPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const { settings } = useSiteSettings();

  const email = settings?.contact_email || "info@almatasawilein.com";
  const phone = settings?.contact_phone || "+20 100 000 0000";
  const address = (isAr ? settings?.contact_address_ar : settings?.contact_address_en)
    || (isAr ? "القاهرة، مصر" : "Cairo, Egypt");

  const cards = [
    { icon: Mail, label: email, href: `mailto:${email}` },
    { icon: Phone, label: phone, href: `tel:${phone.replace(/\s+/g, "")}` },
    { icon: MapPin, label: address, href: null as string | null },
  ];

  return (
    <div className="container-page py-16 max-w-4xl">
      <h1 className="font-display font-black text-4xl mb-8">
        {isAr ? "تواصل معنا" : "Contact us"}
      </h1>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {cards.map((c, i) => {
          const Inner = (
            <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3 h-full">
              <c.icon className="h-5 w-5 text-primary shrink-0" />
              <span className="font-medium break-words">{c.label}</span>
            </div>
          );
          return c.href ? (
            <a key={i} href={c.href} className="hover:border-primary transition-colors rounded-xl">{Inner}</a>
          ) : (
            <div key={i}>{Inner}</div>
          );
        })}
      </div>
      <form className="bg-card border border-border rounded-2xl p-8 space-y-4">
        <input className="w-full h-12 px-4 rounded-md border border-input bg-background" placeholder={isAr ? "الاسم" : "Name"} />
        <input className="w-full h-12 px-4 rounded-md border border-input bg-background" placeholder={isAr ? "البريد" : "Email"} />
        <textarea className="w-full p-4 rounded-md border border-input bg-background min-h-32" placeholder={isAr ? "رسالتك" : "Message"} />
        <button type="submit" className="h-12 px-8 rounded-md bg-primary text-primary-foreground font-bold hover:bg-primary-hover">
          {isAr ? "إرسال" : "Send"}
        </button>
      </form>
    </div>
  );
}
