import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "../../lib/use-site-settings";
import { useLocale } from "../../lib/i18n";
import { useRouterState } from "@tanstack/react-router";

export function WhatsAppFloat() {
  const { settings } = useSiteSettings();
  const locale = useLocale((s) => s.locale);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on admin pages and checkout
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/auth")) {
    return null;
  }

  const raw = settings?.social_whatsapp || settings?.contact_phone || "";
  const phone = raw.replace(/\D/g, "");
  if (!phone || phone.length < 8) return null;

  const message = locale === "ar"
    ? "السلام عليكم، عاوز أستفسر عن كتاب من مكتبة المتسولين"
    : "Hello, I'd like to ask about a book from Al-Motasolen library";
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant hover:scale-110 transition-transform animate-pulse-slow"
      style={{ animationDuration: "2.5s" }}
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />
    </a>
  );
}
