import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";

const STORAGE_KEY = "promo_modal_dismissed";

export function PromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const couponCode = "new5";

  useEffect(() => {
    // Show modal on first visit (only if not dismissed before)
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so it feels intentional
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "modalIn 0.3s ease-out" }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            هناك عرض خاص لك!
          </h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed text-sm mb-6">
            استخدم كوبون New5 لتحصل على 5% خصم لاي اوردر جديد وكمان في شحن
            مجاني لاي اوردر فوق الـ 2000 ج.م
            <br />
            <br />
            وعشان العيد عندنا مميز زودنالك كمان كوبون خصم اسمه Book&apos;s7
            بيديك خصم 7% لما تعمل اوردر بقيمة 1500 ج.م
          </p>

          {/* Coupon Code Box */}
          <div
            className="flex items-center justify-between border-2 border-dashed border-green-400 rounded-xl px-5 py-3 mb-5 cursor-pointer select-none"
            onClick={handleCopy}
            title="انقر لنسخ الكود"
          >
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-green-500 transition-colors"
              aria-label="نسخ الكود"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} />
              )}
            </button>
            <span className="text-xl font-bold text-gray-800 tracking-widest">
              {couponCode}
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClose}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg py-3 rounded-full transition-colors duration-200"
          >
            متابعة التسوق
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
