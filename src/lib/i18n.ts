import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "ar" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "ar",
      setLocale: (locale) => {
        set({ locale });
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
          document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        }
      },
    }),
    { name: "almatasawilein-locale" },
  ),
);

type Dict = Record<string, { ar: string; en: string }>;

export const t = (key: keyof typeof dict, locale: Locale): string =>
  dict[key]?.[locale] ?? String(key);

export const dict = {
  // Nav
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.shop": { ar: "المتجر", en: "Shop" },
  "nav.categories": { ar: "التصنيفات", en: "Categories" },
  "nav.about": { ar: "من نحن", en: "About" },
  "nav.contact": { ar: "تواصل معنا", en: "Contact" },
  "nav.account": { ar: "حسابي", en: "Account" },
  "nav.cart": { ar: "السلة", en: "Cart" },
  "nav.search": { ar: "ابحث عن كتاب...", en: "Search for a book..." },
  "nav.wishlist": { ar: "المفضلة", en: "Wishlist" },

  // Hero
  "hero.tag": { ar: "مكتبة المتسولين", en: "Al-Mutasawilein Library" },
  "hero.title": { ar: "اكتشف عالم الكتب", en: "Discover the world of books" },
  "hero.subtitle": {
    ar: "آلاف العناوين من أمهات الكتب العربية والعالمية، توصيل لكل مصر",
    en: "Thousands of Arabic and international titles, shipped across Egypt",
  },
  "hero.cta": { ar: "تسوّق الآن", en: "Shop now" },
  "hero.cta2": { ar: "تصفح التصنيفات", en: "Browse categories" },

  // Sections
  "section.categories": { ar: "تصنيفات مميزة", en: "Featured Categories" },
  "section.bestsellers": { ar: "الأكثر مبيعاً", en: "Best Sellers" },
  "section.new": { ar: "وصل حديثاً", en: "New Arrivals" },
  "section.featured": { ar: "مختارات المحررين", en: "Editor's Picks" },
  "section.testimonials": { ar: "آراء عملائنا", en: "What our readers say" },
  "section.viewAll": { ar: "عرض الكل", en: "View all" },

  // Product
  "product.addToCart": { ar: "أضف إلى السلة", en: "Add to cart" },
  "product.outOfStock": { ar: "نفد المخزون", en: "Out of stock" },
  "product.inStock": { ar: "متوفر", en: "In stock" },
  "product.author": { ar: "المؤلف", en: "Author" },
  "product.publisher": { ar: "الناشر", en: "Publisher" },
  "product.pages": { ar: "الصفحات", en: "Pages" },
  "product.save": { ar: "وفّر", en: "Save" },

  // Newsletter
  "newsletter.title": { ar: "اشترك في نشرتنا البريدية", en: "Join our newsletter" },
  "newsletter.subtitle": {
    ar: "أحدث الإصدارات والعروض الحصرية في بريدك",
    en: "Latest releases and exclusive offers in your inbox",
  },
  "newsletter.placeholder": { ar: "بريدك الإلكتروني", en: "Your email" },
  "newsletter.subscribe": { ar: "اشترك", en: "Subscribe" },

  // Trust
  "trust.shipping": { ar: "شحن لكل مصر", en: "Egypt-wide shipping" },
  "trust.payment": { ar: "دفع آمن", en: "Secure payment" },
  "trust.cod": { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  "trust.support": { ar: "دعم 24/7", en: "24/7 support" },

  // Footer
  "footer.quickLinks": { ar: "روابط سريعة", en: "Quick links" },
  "footer.help": { ar: "المساعدة", en: "Help" },
  "footer.contact": { ar: "تواصل معنا", en: "Contact" },
  "footer.tagline": {
    ar: "وجهتك الأولى للكتب العربية والعالمية في مصر.",
    en: "Your destination for Arabic and international books in Egypt.",
  },
  "footer.rights": { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },

  // Common
  "common.currency": { ar: "ج.م", en: "EGP" },
  "common.free": { ar: "مجاناً", en: "Free" },
  "common.discount": { ar: "خصم", en: "OFF" },
} satisfies Dict;

export const formatPrice = (price: number, locale: Locale) => {
  const currency = locale === "ar" ? "ج.م" : "EGP";
  return locale === "ar"
    ? `${price.toLocaleString("ar-EG")} ${currency}`
    : `${currency} ${price.toLocaleString("en-US")}`;
};
