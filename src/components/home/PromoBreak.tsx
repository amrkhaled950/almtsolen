import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flame, ArrowLeft } from "lucide-react";
import type { UIProduct } from "../../lib/catalog.functions";
import { formatPrice } from "../../lib/i18n";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'><rect width='300' height='420' fill='#8b1c17'/><text x='150' y='220' font-family='Cairo,serif' font-size='22' fill='#f5e7c4' text-anchor='middle' font-weight='700'>المتسولين</text></svg>`,
  );

export function PromoBreak({ product, isAr }: { product: UIProduct; isAr: boolean }) {
  const title = isAr ? product.title_ar : product.title_en;
  const author = isAr ? product.author_ar : product.author_en;
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;
  const isSale = discount > 0;
  const badge = isSale
    ? (isAr ? `خصم ${discount}%` : `${discount}% OFF`)
    : (isAr ? "الأكثر مبيعاً" : "Bestseller");

  return (
    <section className="container-page py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#a52822] via-[#8b1c17] to-[#4a0e0b] text-primary-foreground shadow-elegant"
      >
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -start-16 h-72 w-72 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-center p-6 md:p-10">
          <div className="order-2 md:order-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold text-gold-foreground text-xs font-black tracking-wide mb-4">
              <Flame className="h-3.5 w-3.5" /> {badge}
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-1">
              {author}
            </p>
            <h3 className="font-display font-black text-2xl md:text-4xl leading-tight mb-4 drop-shadow">
              {title}
            </h3>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display font-black text-3xl md:text-4xl text-gold drop-shadow">
                {formatPrice(product.price, isAr ? "ar" : "en")}
              </span>
              {product.compare_at_price && (
                <span className="text-lg text-primary-foreground/60 line-through">
                  {formatPrice(product.compare_at_price, isAr ? "ar" : "en")}
                </span>
              )}
            </div>
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary-foreground text-primary font-bold hover:bg-gold hover:text-gold-foreground transition-colors shadow-elegant"
            >
              {isAr ? "اطلبه الآن" : "Shop now"}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          <div className="order-1 md:order-2 relative mx-auto">
            <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
            <img
              src={product.cover_url || PLACEHOLDER}
              alt={title}
              className="relative w-40 md:w-56 aspect-[3/4] object-cover rounded-lg shadow-2xl rotate-[-6deg] hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
