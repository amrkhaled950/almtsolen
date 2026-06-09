import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "../lib/i18n";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "تواصل معنا | المتسولين" }] }),
  component: () => {
    const locale = useLocale((s) => s.locale);
    return (
      <div className="container-page py-16 max-w-4xl">
        <h1 className="font-display font-black text-4xl mb-8">
          {locale === "ar" ? "تواصل معنا" : "Contact us"}
        </h1>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Mail, label: "info@almatasawilein.com" },
            { icon: Phone, label: "+20 100 000 0000" },
            { icon: MapPin, label: locale === "ar" ? "القاهرة، مصر" : "Cairo, Egypt" },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
              <c.icon className="h-5 w-5 text-primary" />
              <span className="font-medium">{c.label}</span>
            </div>
          ))}
        </div>
        <form className="bg-card border border-border rounded-2xl p-8 space-y-4">
          <input className="w-full h-12 px-4 rounded-md border border-input bg-background" placeholder={locale === "ar" ? "الاسم" : "Name"} />
          <input className="w-full h-12 px-4 rounded-md border border-input bg-background" placeholder={locale === "ar" ? "البريد" : "Email"} />
          <textarea className="w-full p-4 rounded-md border border-input bg-background min-h-32" placeholder={locale === "ar" ? "رسالتك" : "Message"} />
          <button type="submit" className="h-12 px-8 rounded-md bg-primary text-primary-foreground font-bold hover:bg-primary-hover">
            {locale === "ar" ? "إرسال" : "Send"}
          </button>
        </form>
      </div>
    );
  },
});
