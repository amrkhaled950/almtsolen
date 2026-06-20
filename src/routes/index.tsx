import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { ProductGridSkeleton } from "../components/ui/skeletons";

import { useLocale, t } from "../lib/i18n";
import { ProductCard } from "../components/product/ProductCard";
import { ProductCarousel } from "../components/home/ProductCarousel";
import { listCategoriesPublic, listProductsPublic } from "../lib/catalog.functions";
import { useSiteSettings } from "../lib/use-site-settings";
import { parseHomeSections } from "../lib/home-sections";
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
  const { data: latestData, isLoading: latestLoading } = useQuery({ queryKey: ["products","latest","all"], queryFn: () => fetchProducts({ data: {} }) });

  const allCats  = (catData?.categories ?? []) as any[];
  const rootCats = allCats.filter((c) => !c.parent_id && c.is_active)
    .sort((a, b) => (a.nav_order ?? a.display_order ?? 0) - (b.nav_order ?? b.display_order ?? 0));
  const subCatsOf = (pid: string) =>
    allCats.filter((c) => c.parent_id === pid && c.is_active)
      .sort((a, b) => (a.nav_order ?? 0) - (b.nav_order ?? 0));

  const bestsellers = bestData?.products ?? [];
  const newArrivals = newData?.products  ?? [];
  const latest      = latestData?.products ?? [];

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
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        {heroImages.length > 0 && (
          <>
            {heroImages.map((img, i) => (
              <div
                key={i}
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: `url(${img.url})`, opacity: i === heroIdx ? 0.35 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/80" />
          </>
        )}
        <div className="container-page relative py-16 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur text-xs font-semibold mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.tag", locale)}
            </span>
            <h1 className="font-display font-black text-4xl md:text-6xl leading-tight mb-5">
              {heroTitle}
              {!settings?.hero_title_ar && !settings?.hero_title_en && (
                <span className="block text-gold mt-2">{isAr ? "بين يديك" : "in your hands"}</span>
              )}
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed max-w-xl mx-auto">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/shop" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary-foreground text-primary font-bold hover:bg-gold hover:text-gold-foreground transition-colors shadow-elegant">
                {t("hero.cta", locale)} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link to="/categories" className="inline-flex items-center gap-2 h-12 px-7 rounded-full border-2 border-primary-foreground/40 hover:bg-primary-foreground/10 font-bold transition-colors">
                {t("hero.cta2", locale)}
              </Link>
            </div>
            {heroImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-8">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === heroIdx ? "w-8 bg-primary-foreground" : "w-2 bg-primary-foreground/40"}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
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
                className="flex flex-col items-center gap-2 bg-card rounded-xl p-3 text-center hover:shadow-elegant transition-all hover:-translate-y-1 border border-border group">
                <span className="text-3xl group-hover:scale-110 transition-transform">
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
      {!hasCustomSections && rootCats.map((cat: any, i: number) => {
        const subs = subCatsOf(cat.id);
        const products = catProductQueries[i]?.data?.products ?? [];
        const loading  = catProductQueries[i]?.isLoading;
        if (!loading && products.length === 0) return null;
        return (
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
      })}

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

      {/* ── All books ────────────────────────────────────────── */}
      <section className="container-page py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl">
            📚 {isAr ? "كل الكتب" : "All books"}
          </h2>
          <Link to="/shop" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
            {isAr ? "عرض الكل" : "View all"} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {latestLoading ? (
          <ProductGridSkeleton count={8} />

        ) : latest.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">{isAr ? "لا توجد كتب بعد." : "No books yet."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {latest.map((p: any, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}
