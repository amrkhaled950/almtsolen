import { Link, useNavigate } from "@tanstack/react-router";
import { Star, ShoppingBag, Heart, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { UIProduct } from "../../lib/catalog.functions";
import { useLocale, t, formatPrice } from "../../lib/i18n";
import { useCart, useWishlist } from "../../lib/cart-store";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'><rect width='300' height='420' fill='#98040c'/><text x='150' y='220' font-family='Cairo,serif' font-size='22' fill='#f5e7c4' text-anchor='middle' font-weight='700'>المتسولين</text></svg>`,
  );

export function ProductCard({ product, index = 0 }: { product: UIProduct; index?: number }) {
  const locale = useLocale((s) => s.locale);
  const addItem = useCart((s) => s.addItem);
  const wishlist = useWishlist();
  const inWishlist = wishlist.has(product.id);
  const navigate = useNavigate();

  const inStock = product.unlimited_stock || product.stock > 0;
  const cover = product.cover_url || PLACEHOLDER;
  const title = locale === "ar" ? product.title_ar : product.title_en;
  const author = locale === "ar" ? product.author_ar : product.author_en;

  const discount = product.compare_at_price
    ? Math.round(
        ((product.compare_at_price - product.price) / product.compare_at_price) * 100,
      )
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addItem(product, 1);
    toast.success(locale === "ar" ? "تمت الإضافة إلى السلة" : "Added to cart");
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addItem(product, 1);
    navigate({ to: "/checkout" });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlist.toggle(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block bg-card rounded-xl overflow-hidden shadow-card-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={cover}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
                -{discount}%
              </span>
            )}
            {product.is_new_arrival && (
              <span className="bg-gold text-gold-foreground text-xs font-bold px-2 py-1 rounded-md">
                {locale === "ar" ? "جديد" : "NEW"}
              </span>
            )}
            {!inStock && (
              <span className="bg-muted-foreground text-background text-xs font-bold px-2 py-1 rounded-md">
                {t("product.outOfStock", locale)}
              </span>
            )}
          </div>

          <button
            onClick={handleWishlist}
            className={cn(
              "absolute top-3 end-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur shadow-card-soft hover:scale-110 transition-transform",
              inWishlist && "text-primary",
            )}
            aria-label="Wishlist"
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>

          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-elegant"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("product.addToCart", locale)}
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-1 truncate">{author}</p>
          <h3 className="font-display font-bold text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-1 mb-2.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < Math.round(product.rating || 0) ? "fill-gold text-gold" : "text-muted",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-primary text-lg">
              {formatPrice(product.price, locale)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compare_at_price, locale)}
              </span>
            )}
          </div>
          {inStock && !product.unlimited_stock && product.stock > 0 && product.stock <= 5 && (
            <p className="mt-2 text-[11px] font-semibold text-primary animate-pulse">
              {locale === "ar"
                ? `متبقي ${product.stock} نسخ فقط!`
                : `Only ${product.stock} left!`}
            </p>
          )}

        </div>
      </Link>
    </motion.div>
  );
}
