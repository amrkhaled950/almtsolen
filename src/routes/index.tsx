import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { ProductGridSkeleton } from "../components/ui/skeletons";

import { useLocale, t } from "../lib/i18n";
import { ProductCard } from "../components/product/ProductCard";
import { ProductCarousel } from "../components/home/ProductCarousel";
import { PromoBreak } from "../components/home/PromoBreak";
import { listCategoriesPublic, listProductsPublic, getProductPublic } from "../lib/catalog.functions";
import { useSiteSettings } from "../lib/use-site-settings";
import { parseHomeSections } from "../lib/home-sections";
import { parsePromoBreaks } from "../lib/promo-breaks";
import { pickCategoryIcon } from "../lib/category-icon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مكتبة المتسولين | أفضل متجر كتب عربية في مصر" },
      { name: "description", content: "اشترِ كتبك المفضلة من مكتبة المتسولين. آلاف العناوين العربية والمترجمة، أسعار مميزة، توصيل لكل محافظات مصر، والدفع عند الاستلام." },
      { property: "og:title", content: "مكتبة المتسولين | كتبك العربية المفضلة" },
      { property: "og:description", content: "آلاف العناوين العربية بأسعار مميزة وتوصيل لكل مصر مع الدفع عند الاستلام." },
      { property: "og:url", content: "https://www.almotasolen.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/" }],
  }),
  component: Home,
});


function Home() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const fetchCats = useServerFn(listCategoriesPublic);
  const fetchProducts = useServerFn(listProductsPublic);
  const { settings } = useSiteSettings();

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const { data: bestData } = useQuery({ queryKey: ["products","bestsellers"], queryFn: () => fetchProducts({ data: { bestseller: true, limit: 8 } }) });
  const { data: newData }  = useQuery({ queryKey: ["products","new"], queryFn: () => fetchProducts({ data: { new_arrival: true, limit: 8 } }) });
  

  const allCats  = (catData?.categories ?? []) as any[];
  const rootCats = allCats.filter((c) => !c.parent_id && c.is_active)
    .sort((a, b) => (a.nav_order ?? a.display_order ?? 0) - (b.nav_order ?? b.display_order ?? 0));
  const subCatsOf = (pid: string) =>
    allCats.filter((c) => c.parent_id === pid && c.is_active)
      .sort((a, b) => (a.nav_order ?? 0) - (b.nav_order ?? 0));

  const bestsellers = bestData?.products ?? [];
  const newArrivals = newData?.products  ?? [];
  

  // Custom home-page carousels from settings
  const homeSections = parseHomeSections(settings).filter((sec) => sec.enabled);
  const hasCustomSections = homeSections.length > 0;

  const carouselQueries = useQueries({
    queries: homeSections.map((sec) => ({
      queryKey: ["products", "home-sec", sec.source, sec.category_slug, sec.limit],
      queryFn: () => fetchProducts({
        data: {
          ...(sec.source === "category"     ? { category_slug: sec.category_slug } : {}),
          ...(sec.source === "bestsellers"  ? { bestseller: true }                 : {}),
          ...(sec.source === "new_arrivals" ? { new_arrival: true }                : {}),
          ...(sec.source === "featured"     ? { featured: true }                   : {}),
          limit: sec.limit,
        },
      }),
      enabled: sec.source !== "category" || !!sec.category_slug,
    })),
  });

  // Fetch products for each root category (fallback when no custom sections set)
  const catSlugs = rootCats.map((c: any) => c.slug);
  const catProductQueries = useQueries({
    queries: catSlugs.map((slug: string) => ({
      queryKey: ["products", "cat", slug],
      queryFn: () => fetchProducts({ data: { category_slug: slug, limit: 8 } }),
      enabled: !!slug && !hasCustomSections,
    })),
  });

  // Configured promo breaks (managed from admin)
  const configuredBreaks = parsePromoBreaks(settings).filter((b) => b.enabled && b.product_slug);
  const fetchProductBySlug = useServerFn(getProductPublic);
  const promoBreakQueries = useQueries({
    queries: configuredBreaks.map((b) => ({
      queryKey: ["promo-break-product", b.product_slug],
      queryFn: () => fetchProductBySlug({ data: { slug: b.product_slug } }),
      staleTime: 5 * 60_000,
    })),
  });

  const configuredPromoBreaks = configuredBreaks
    .map((b, i) => ({ cfg: b, product: promoBreakQueries[i]?.data?.product }))
    .filter((x): x is { cfg: typeof configuredBreaks[number]; product: NonNullable<typeof x.product> } => !!x.product);


  const heroTitle = (isAr ? settings?.hero_title_ar : settings?.hero_title_en) || t("hero.title", locale);
  const heroSubtitle = (isAr ? settings?.hero_subtitle_ar : settings?.hero_subtitle_en) || t("hero.subtitle", locale);
  const heroImages = settings?.hero_images ?? [];

  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 5000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  return (
    <div>
      {/* ── Hero Slider ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        {heroImages.length > 0 && (
          <>
            {heroImages.map((img, i) => (
              <div
                key={i}
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
                style={{ backgroundImage: `url(${img.url})`, opacity: i === heroIdx ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/60 to-primary/85" />
          </>
        )}
        <div className="container-page relative py-20 md:py-32 text-center min-h-[420px] md:min-h-[560px] flex items-center justify-center">
          <motion.div
            key={heroIdx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur text-xs font-semibold mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.tag", locale)}
            </span>
            <h1 className="font-display font-black text-4xl md:text-6xl leading-tight mb-5 drop-shadow-lg">
              {heroTitle}
              {!settings?.hero_title_ar && !settings?.hero_title_en && (
                <span className="block text-gold mt-2">{isAr ? "بين يديك" : "in your hands"}</span>
              )}
            </h1>
            <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed max-w-xl mx-auto drop-shadow">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                <Link to="/shop" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary-foreground text-primary font-bold hover:bg-gold hover:text-gold-foreground transition-colors shadow-elegant">
                  {t("hero.cta", locale)} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                <Link to="/categories" className="inline-flex items-center gap-2 h-12 px-7 rounded-full border-2 border-primary-foreground/40 hover:bg-primary-foreground/10 font-bold transition-colors">
                  {t("hero.cta2", locale)}
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {heroImages.length > 1 && (
            <>
              <button
                onClick={() => setHeroIdx((i) => (i - 1 + heroImages.length) % heroImages.length)}
                aria-label="Previous slide"
                className="absolute start-3 md:start-6 top-1/2 -translate-y-1/2 grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/30 backdrop-blur border border-primary-foreground/25 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setHeroIdx((i) => (i + 1) % heroImages.length)}
                aria-label="Next slide"
                className="absolute end-3 md:end-6 top-1/2 -translate-y-1/2 grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/30 backdrop-blur border border-primary-foreground/25 transition-colors"
              >
                <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex justify-center gap-1.5">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === heroIdx ? "w-8 bg-primary-foreground" : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/70"}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Categories icons row ─────────────────────────────── */}
      {rootCats.length > 0 && (
        <section className="container-page py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl">
              {isAr ? "تصفح التصنيفات" : "Browse categories"}
            </h2>
            <Link to="/categories" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              {isAr ? "الكل" : "All"} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {rootCats.map((c: any) => (
              <Link key={c.id} to="/shop" search={{ category: c.slug } as any}
                className="flex flex-col items-center gap-2 bg-gradient-to-br from-[#a52822] via-[#8b1c17] to-[#6a1410] text-primary-foreground rounded-xl p-3 text-center hover:shadow-elegant transition-all hover:-translate-y-1 border border-[#8b1c17]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_-6px_rgba(139,28,23,0.55)] group">
                <span className="text-3xl group-hover:scale-110 transition-transform [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.25)]">
                  {c.icon || pickCategoryIcon(c.name_ar, c.name_en, c.slug)}
                </span>
                <span className="font-semibold text-xs leading-tight">
                  {isAr ? c.name_ar : c.name_en}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Custom home carousels (managed from dashboard) ───── */}
      {homeSections.map((sec, i) => {
        const q = carouselQueries[i];
        const products = q?.data?.products ?? [];
        const loading  = q?.isLoading;
        const title = (isAr ? sec.title_ar : sec.title_en) || (isAr ? sec.title_en : sec.title_ar) || "";
        const viewAllSearch = sec.source === "category" && sec.category_slug ? { category: sec.category_slug } : undefined;
        return (
          <ProductCarousel
            key={sec.id}
            title={title}
            products={products}
            loading={loading}
            isAr={isAr}
            viewAllHref="/shop"
            viewAllSearch={viewAllSearch}
          />
        );
      })}

      {/* ── Per-category sections (auto fallback if no custom carousels) ── */}
      {!hasCustomSections && (() => {
        // Promo pool: use admin-configured breaks first; otherwise auto-pick from discounted/bestsellers
        const usingConfigured = configuredPromoBreaks.length > 0;
        const allCatProducts = catProductQueries.flatMap((q: any) => q?.data?.products ?? []);
        const autoPool = [
          ...allCatProducts.filter((p: any) => p.compare_at_price && p.compare_at_price > p.price),
          ...bestsellers.filter((p: any) => p.compare_at_price && p.compare_at_price > p.price),
          ...bestsellers,
          ...newArrivals,
          ...allCatProducts,
        ].filter((p: any, i: number, arr: any[]) => arr.findIndex((x) => x.id === p.id) === i);

        const visibleCats = rootCats.filter((cat: any, i: number) => {
          const products = catProductQueries[i]?.data?.products ?? [];
          const loading = catProductQueries[i]?.isLoading;
          return loading || products.length > 0;
        });

        const nodes: React.ReactNode[] = [];
        let promoIdx = 0;
        visibleCats.forEach((cat: any, vi: number) => {
          const originalIdx = rootCats.indexOf(cat);
          const products = catProductQueries[originalIdx]?.data?.products ?? [];
          const loading = catProductQueries[originalIdx]?.isLoading;
          const subs = subCatsOf(cat.id);

          nodes.push(
            <section key={cat.id} className="container-page py-10">
              <div className="flex items-end justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.icon || pickCategoryIcon(cat.name_ar, cat.name_en, cat.slug)}</span>
                  <div>
                    <h2 className="font-display font-extrabold text-2xl md:text-3xl">
                      {isAr ? cat.name_ar : cat.name_en}
                    </h2>
                    {subs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {subs.map((sub: any) => (
                          <Link key={sub.id} to="/shop" search={{ category: sub.slug } as any}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-xs font-medium transition-colors">
                            {sub.icon && <span>{sub.icon}</span>}
                            {isAr ? sub.name_ar : sub.name_en}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Link to="/shop" search={{ category: cat.slug } as any}
                  className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 shrink-0">
                  {isAr ? "عرض الكل" : "View all"} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
              {loading ? (
                <ProductGridSkeleton count={4} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((p: any, pi: number) => <ProductCard key={p.id} product={p} index={pi} />)}
                </div>
              )}
            </section>
          );

          // Insert promo break every 3 categories (not after the last one)
          const isBreakPoint = (vi + 1) % 3 === 0 && vi < visibleCats.length - 1;
          if (isBreakPoint) {
            if (usingConfigured) {
              const item = configuredPromoBreaks[promoIdx % configuredPromoBreaks.length];
              if (item) {
                nodes.push(
                  <PromoBreak
                    key={`promo-${vi}`}
                    product={item.product}
                    isAr={isAr}
                    badge={isAr ? item.cfg.badge_ar : item.cfg.badge_en}
                    headline={isAr ? item.cfg.headline_ar : item.cfg.headline_en}
                    cta={isAr ? item.cfg.cta_ar : item.cfg.cta_en}
                    priceOverride={item.cfg.price_override}
                  />
                );
                promoIdx++;
              }
            } else if (autoPool[promoIdx]) {
              nodes.push(<PromoBreak key={`promo-${vi}`} product={autoPool[promoIdx]} isAr={isAr} />);
              promoIdx++;
            }
          }
        });

        return nodes;
      })()}

      {/* ── Bestsellers ──────────────────────────────────────── */}
      {bestsellers.length > 0 && (
        <section className="container-page py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> {t("section.bestsellers", locale)}
            </h2>
            <Link to="/shop" className="text-primary font-semibold hover:underline text-sm">→</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {bestsellers.map((p: any, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* ── New arrivals ─────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="container-page py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> {t("section.new", locale)}
            </h2>
            <Link to="/shop" className="text-primary font-semibold hover:underline text-sm">→</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {newArrivals.map((p: any, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

    </div>
  );
}
