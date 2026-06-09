import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingBag, Heart, Truck, ShieldCheck, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocale, t, formatPrice } from "../lib/i18n";
import { useCart, useWishlist } from "../lib/cart-store";
import { getProductPublic } from "../lib/catalog.functions";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/product/$slug")({
  ssr: false,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const addItem = useCart((s) => s.addItem);
  const wishlist = useWishlist();
  const [qty, setQty] = useState(1);

  const fetchProduct = useServerFn(getProductPublic);
  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct({ data: { slug } }),
  });

  if (isLoading) {
    return <div className="container-page py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  const product = data?.product;
  if (!product) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{isAr ? "الكتاب غير موجود" : "Not found"}</h1>
        <Link to="/shop" className="text-primary">{isAr ? "العودة للمتجر" : "Back to shop"}</Link>
      </div>
    );
  }

  const title = isAr ? product.title_ar : product.title_en;
  const author = isAr ? product.author_ar : product.author_en;
  const description = isAr ? product.description_ar : product.description_en;
  const inStock = product.stock > 0;
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="container-page py-10">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="bg-card rounded-2xl p-8 flex items-center justify-center">
          <img src={product.cover_url ?? ""} alt={title} className="max-h-[500px] rounded-lg shadow-elegant bg-muted" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">{author}</p>
          <h1 className="font-display font-black text-3xl md:text-4xl mb-3">{title}</h1>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating || 0) ? "fill-gold text-gold" : "text-muted")} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews_count})</span>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display font-black text-4xl text-primary">{formatPrice(product.price, locale)}</span>
            {product.compare_at_price && (
              <>
                <span className="text-muted-foreground line-through text-lg">{formatPrice(product.compare_at_price, locale)}</span>
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">-{discount}%</span>
              </>
            )}
          </div>
          {description && <p className="text-foreground/80 leading-relaxed mb-6">{description}</p>}
          <div className="flex items-center gap-3 mb-6">
            <span className={cn("text-sm font-semibold px-3 py-1 rounded-full", inStock ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {inStock ? t("product.inStock", locale) : t("product.outOfStock", locale)}
            </span>
          </div>
          {inStock && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-border rounded-md h-12">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-12 w-12 hover:bg-muted font-bold">−</button>
                <span className="w-12 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="h-12 w-12 hover:bg-muted font-bold">+</button>
              </div>
              <button
                onClick={() => { addItem(product, qty); toast.success(isAr ? "تمت الإضافة" : "Added"); }}
                className="flex-1 h-12 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary-hover shadow-elegant"
              >
                <ShoppingBag className="h-5 w-5" /> {t("product.addToCart", locale)}
              </button>
              <button onClick={() => wishlist.toggle(product.id)} className={cn("h-12 w-12 grid place-items-center rounded-md border border-border hover:bg-muted", wishlist.has(product.id) && "text-primary border-primary")}>
                <Heart className={cn("h-5 w-5", wishlist.has(product.id) && "fill-current")} />
              </button>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
            {[
              { icon: Truck, label: isAr ? "شحن سريع" : "Fast shipping" },
              { icon: ShieldCheck, label: isAr ? "دفع آمن" : "Secure pay" },
              { icon: RotateCcw, label: isAr ? "إرجاع 14 يوم" : "14-day return" },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <f.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
