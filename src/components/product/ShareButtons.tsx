import { Facebook, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "../../lib/i18n";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      key: "facebook",
      label: "Facebook",
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "bg-[#1877F2] hover:bg-[#0d6ae0] text-white",
    },
    {
      key: "twitter",
      label: "X",
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: "bg-black hover:bg-neutral-800 text-white",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      Icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      className: "bg-[#25D366] hover:bg-[#1ebe57] text-white",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(isAr ? "تم نسخ الرابط" : "Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isAr ? "تعذر النسخ" : "Copy failed");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground font-semibold">
        {isAr ? "شارك:" : "Share:"}
      </span>
      {targets.map((t) => (
        <a
          key={t.key}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${t.label}`}
          className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition-transform hover:scale-110 ${t.className}`}
        >
          <t.Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/80 text-foreground transition-transform hover:scale-110"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
