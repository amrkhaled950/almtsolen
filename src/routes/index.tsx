import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, TrendingUp, Loader2, ChevronRight } from "lucide-react";
import { useLocale, t } from "../lib/i18n";
import { ProductCard } from "../components/product/ProductCard";
import { listCategoriesPublic, listProductsPublic } from "../lib/catalog.functions";
import { useSiteSettings } from "../lib/use-site-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المتسولين | مكتبتك العربية المفضلة" },
      { name: "description", content: "متجر المتسولين للكتب — توصيل لكل مصر." },
    ],
  }),
  component: Home,
});

function Home() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const fetchCats = useServerFn(listCategoriesPublic);
  const fetchProducts = useServerFn(listProductsPublic);

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const { data: bestData } = useQuery({ queryKey: ["products","bestsellers"], queryFn: () => fetchProducts({ data: { bestseller: true, limit: 8 } }) });
  const { data: newData }  = useQuery({ queryKey: ["products","new"], queryFn: () => fetchProducts({ data: { new_arrival: true, limit: 8 } }) });
  const { data: latestData, isLoading: latestLoading } = useQuery({ queryKey: ["products","latest"], queryFn: () => fetchProducts({ data: { limit: 8 } }) });

  const allCats  = (catData?.categories ?? []) as any[];
  const rootCats = allCats.filter((c) => !c.parent_id && c.is_active)
    .sort((a, b) => (a.nav_order ?? a.display_order ?? 0) - (b.nav_order ?? b.display_order ?? 0));
  const subCatsOf = (pid: string) =>
    allCats.filter((c) => c.parent_id === pid && c.is_active)
      .sort((a, b) => (a.nav_order ?? 0) - (b.nav_order ?? 0));

  const bestsellers = bestData?.products ?? [];
  const newArrivals = newData?.products  ?? [];
  const latest      = latestData?.products ?? [];

  // Fetch products for each root category
  const catSlugs = rootCats.map((c: any) => c.slug);
  const catProductQueries = useQueries({
    queries: catSlugs.map((slug: string) => ({
      queryKey: ["products", "cat", slug],
      queryFn: () => fetchProducts({ data: { category_slug: slug, limit: 8 } }),
      enabled: !!slug,
    })),
  });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="container-page relative py-16 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur text-xs font-semibold mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.tag", locale)}
            </span>
            <h1 className="font-display font-black text-4xl md:text-6xl leading-tight mb-5">
              {t("hero.title", locale)}
              <span className="block text-gold mt-2">{isAr ? "بين يديك" : "in your hands"}</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed max-w-xl mx-auto">
              {t("hero.subtitle", locale)}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/shop" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary-foreground text-primary font-bold hover:bg-gold hover:text-gold-foreground transition-colors shadow-elegant">
                {t("hero.cta", locale)} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link to="/categories" className="inline-flex items-center gap-2 h-12 px-7 rounded-full border-2 border-primary-foreground/40 hover:bg-primary-foreground/10 font-bold transition-colors">
                {t("hero.cta2", locale)}
              </Link>
            </div>
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
                  {c.icon || c.image_url || "📖"}
                </span>
                <span className="font-semibold text-xs leading-tight">
                  {isAr ? c.name_ar : c.name_en}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Per-category sections ────────────────────────────── */}
      {rootCats.map((cat: any, i: number) => {
        const subs = subCatsOf(cat.id);
        const products = catProductQueries[i]?.data?.products ?? [];
        const loading  = catProductQueries[i]?.isLoading;
        if (!loading && products.length === 0) return null;
        return (
          <section key={cat.id} className="container-page py-10">
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cat.icon || cat.image_url || "📖"}</span>
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
              <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
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
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
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
