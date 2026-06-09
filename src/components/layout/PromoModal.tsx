import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { useSiteSettings } from "@/lib/use-site-settings";
import { useLocale } from "@/lib/i18n";

const STORAGE_KEY = "promo_modal_dismissed";

export function PromoModal() {
  const { settings } = useSiteSettings();
  const isAr = useLocale((s) => s.locale === "ar");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const cs = settings?.custom_strings || {};
  const enabled = (cs["promo_enabled"]?.ar ?? "") === "1";
  const pick = (k: string, fallback = "") =>
    (isAr ? cs[k]?.ar : cs[k]?.en) || cs[k]?.ar || cs[k]?.en || fallback;

  const title = pick("promo_title");
  const description = pick("promo_description");
  const couponCode = (cs["promo_coupon"]?.ar || cs["promo_coupon"]?.en || "").trim();
  const cta = pick("promo_cta", isAr ? "متابعة التسوق" : "Continue shopping");

  useEffect(() => {
    if (!enabled || !title) return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [enabled, title]);

  const handleClose = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleCopy = async () => {
    if (!couponCode) return;
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = couponCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !enabled || !title) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
          dir={isAr ? "rtl" : "ltr"}
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "modalIn 0.3s ease-out" }}
        >
          <button
            onClick={handleClose}
            className={`absolute top-4 ${isAr ? "left-4" : "right-4"} text-gray-400 hover:text-gray-600 transition-colors`}
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>

          {description && (
            <p className="text-gray-600 leading-relaxed text-sm mb-6 whitespace-pre-line">
              {description}
            </p>
          )}

          {couponCode && (
            <div
              className="flex items-center justify-between border-2 border-dashed border-green-400 rounded-xl px-5 py-3 mb-5 cursor-pointer select-none"
              onClick={handleCopy}
              title={isAr ? "انقر لنسخ الكود" : "Click to copy"}
            >
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-green-500 transition-colors"
                aria-label={isAr ? "نسخ الكود" : "Copy code"}
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
              <span className="text-xl font-bold text-gray-800 tracking-widest uppercase">
                {couponCode}
              </span>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg py-3 rounded-full transition-colors duration-200"
          >
            {cta}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
