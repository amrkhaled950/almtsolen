import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flame, ArrowLeft, Sparkles } from "lucide-react";
import type { UIProduct } from "../../lib/catalog.functions";
import { formatPrice } from "../../lib/i18n";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'><rect width='300' height='420' fill='#8b1c17'/><text x='150' y='220' font-family='Cairo,serif' font-size='22' fill='#f5e7c4' text-anchor='middle' font-weight='700'>المتسولين</text></svg>`,
  );

export type PromoBreakProps = {
  product: UIProduct;
  isAr: boolean;
  /** Custom badge label (falls back to sale % or "Bestseller") */
  badge?: string;
  /** Overrides the book title as the promo headline */
  headline?: string;
  /** CTA button label */
  cta?: string;
  /** Overrides displayed price */
  priceOverride?: number | null;
};

export function PromoBreak({ product, isAr, badge, headline, cta, priceOverride }: PromoBreakProps) {
  const title = headline || (isAr ? product.title_ar : product.title_en);
  const author = isAr ? product.author_ar : product.author_en;
  const displayPrice = priceOverride ?? product.price;
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const defaultBadge = discount > 0
    ? (isAr ? `خصم ${discount}%` : `${discount}% OFF`)
    : (isAr ? "عرض مميز" : "Featured");
  const badgeLabel = badge && badge.trim() ? badge : defaultBadge;

  const ctaLabel = cta && cta.trim() ? cta : (isAr ? "اطلبه الآن" : "Shop now");
  const localeStr: "ar" | "en" = isAr ? "ar" : "en";

  return (
    <section className="container-page py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] bg-[#8b1c17] text-primary-foreground shadow-elegant"
      >
        {/* Layered gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#a52822] via-[#8b1c17] to-[#3d0a08]" />

        {/* Soft light beams */}
        <div className="pointer-events-none absolute -top-32 -end-24 h-80 w-80 rounded-full bg-gold/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-28 -start-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-[90px]" />

        {/* Subtle noise / grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Diagonal accent line */}
        <div className="pointer-events-none absolute inset-y-0 start-1/2 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent -skew-x-12" />

        <div className="relative grid md:grid-cols-[1.15fr_1fr] gap-8 md:gap-12 items-center px-6 md:px-12 py-10 md:py-14">
          {/* Text side */}
          <div className="order-2 md:order-1 relative">
            {/* Sale ribbon */}
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold text-gold-foreground text-[11px] font-black tracking-[0.15em] uppercase shadow-lg">
                <Flame className="h-3.5 w-3.5" />
                {badgeLabel}
              </span>
              <Sparkles className="h-4 w-4 text-gold/80" />
            </div>

            {author && (
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary-foreground/60 mb-2 font-semibold">
                {author}
              </p>
            )}

            <h3 className="font-display font-black text-3xl md:text-5xl leading-[1.05] mb-5 drop-shadow-md text-balance">
              {title}
            </h3>

            {/* Price row */}
            <div className="flex items-baseline gap-4 mb-7">
              <span className="font-display font-black text-4xl md:text-5xl text-gold drop-shadow">
                {formatPrice(displayPrice, localeStr)}
              </span>
              {product.compare_at_price && product.compare_at_price > displayPrice && (
                <span className="text-lg md:text-xl text-primary-foreground/50 line-through decoration-2">
                  {formatPrice(product.compare_at_price, localeStr)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/product/$slug"
                params={{ slug: product.slug }}
                className="group inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary-foreground text-primary font-black text-sm tracking-wide hover:bg-gold hover:text-gold-foreground transition-all shadow-elegant hover:shadow-glow hover:-translate-y-0.5"
              >
                {ctaLabel}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-xs text-primary-foreground/60 font-medium">
                {isAr ? "شحن سريع • دفع عند الاستلام" : "Fast shipping • Cash on delivery"}
              </span>
            </div>
          </div>

          {/* Book display side */}
          <div className="order-1 md:order-2 relative flex justify-center">
            {/* Glow behind book */}
            <div className="absolute inset-0 bg-gold/30 blur-3xl rounded-full scale-75" />

            {/* Shadow book (stacked behind) */}
            <div className="absolute top-6 md:top-8 h-full w-40 md:w-52 aspect-[3/4] bg-black/40 rounded-lg rotate-[8deg] blur-sm" />

            {/* Main book cover */}
            <motion.div
              initial={{ rotate: -12, y: 20 }}
              whileInView={{ rotate: -6, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ rotate: 0, scale: 1.03 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative"
            >
              <img
                src={product.cover_url || PLACEHOLDER}
                alt={title}
                className="relative w-44 md:w-56 lg:w-64 aspect-[3/4] object-cover rounded-lg shadow-2xl ring-1 ring-white/10"
              />
              {/* Corner discount badge on the cover */}
              {discount > 0 && !badge && (
                <span className="absolute -top-3 -end-3 grid h-16 w-16 place-items-center rounded-full bg-gold text-gold-foreground font-black text-sm shadow-xl rotate-12">
                  -{discount}%
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
