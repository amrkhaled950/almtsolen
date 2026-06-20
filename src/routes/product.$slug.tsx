import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Star, ShoppingBag, Heart, Truck, ShieldCheck, RotateCcw, Flame } from "lucide-react";
import { useState } from "react";
import { useLocale, t, formatPrice } from "../lib/i18n";
import { useCart, useWishlist } from "../lib/cart-store";
import { getProductPublic, listRelatedProductsPublic } from "../lib/catalog.functions";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { ProductPageSkeleton } from "../components/ui/skeletons";
import { ShareButtons } from "../components/product/ShareButtons";
import { ProductCard } from "../components/product/ProductCard";
import { ProductReviews } from "../components/product/Reviews";


const productQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductPublic({ data: { slug } }),
    staleTime: 5 * 60 * 1000,
  });

const SITE_URL = "https://www.almotasolen.com";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(productQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const p = (loaderData as any)?.product;
    if (!p) {
      return {
        meta: [
          { title: "كتاب | مكتبة المتسولين" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${p.title_ar} - ${p.author_ar} | مكتبة المتسولين`;
    const rawDesc = (p.description_ar || `كتاب ${p.title_ar} للمؤلف ${p.author_ar}. اشتر الآن من مكتبة المتسولين بسعر ${p.price} ج.م مع توصيل لكل مصر.`).trim();
    const description = rawDesc.slice(0, 160);
    const url = `${SITE_URL}/product/${encodeURIComponent(params.slug)}`;
    const image = p.cover_url || `${SITE_URL}/logo.png`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        { property: "og:image", content: image },
        { property: "product:price:amount", content: String(p.price) },
        { property: "product:price:currency", content: "EGP" },
        { property: "product:availability", content: (p.unlimited_stock || p.stock > 0) ? "in stock" : "out of stock" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title_ar,
            image: [image],
            description: rawDesc,
            sku: p.id,
            ...(p.isbn ? { gtin13: p.isbn } : {}),
            brand: { "@type": "Brand", name: p.publisher_ar || "مكتبة المتسولين" },
            author: { "@type": "Person", name: p.author_ar },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "EGP",
              price: p.price,
              availability: (p.unlimited_stock || p.stock > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            ...(p.rating && p.reviews_count
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: p.rating,
                    reviewCount: p.reviews_count,
                  },
                }
              : {}),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "المتجر", item: `${SITE_URL}/shop` },
              { "@type": "ListItem", position: 3, name: p.title_ar, item: url },
            ],
          }),
        },
      ],
    };
  },
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
    ...productQueryOptions(slug),
    queryFn: () => fetchProduct({ data: { slug } }),
  });

  if (isLoading) {
    return <ProductPageSkeleton />;

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
  const inStock = product.unlimited_stock || product.stock > 0;
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
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className={cn("text-sm font-semibold px-3 py-1 rounded-full", inStock ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {inStock ? t("product.inStock", locale) : t("product.outOfStock", locale)}
            </span>
            {inStock && !product.unlimited_stock && product.stock > 0 && product.stock <= 5 && (
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1.5 animate-pulse">
                <Flame className="h-3.5 w-3.5" />
                {isAr ? `متبقي ${product.stock} نسخ فقط!` : `Only ${product.stock} left!`}
              </span>
            )}
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
          <div className="mt-6 pt-6 border-t border-border">
            <ShareButtons
              url={`https://www.almotasolen.com/product/${product.slug}`}
              title={title}
            />
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} isAr={isAr} />
      <RelatedProducts productId={product.id} isAr={isAr} />
    </div>
  );
}

function RelatedProducts({ productId, isAr }: { productId: string; isAr: boolean }) {
  const fetchRelated = useServerFn(listRelatedProductsPublic);
  const { data } = useQuery({
    queryKey: ["related", productId],
    queryFn: () => fetchRelated({ data: { product_id: productId, limit: 8 } }),
    staleTime: 5 * 60 * 1000,
  });
  const items = data?.products ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display font-black text-2xl md:text-3xl mb-6">
        {isAr ? "كتب قد تعجبك" : "You may also like"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}


