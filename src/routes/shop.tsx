import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useLocale } from "../lib/i18n";
import { ProductCard } from "../components/product/ProductCard";
import { listProductsPublic, listCategoriesPublic } from "../lib/catalog.functions";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ProductGridSkeleton } from "../components/ui/skeletons";

const PER_PAGE = 25;

const sortEnum = z.enum(["new", "price-asc", "price-desc", "rating"]);

const shopSearchSchema = z.object({
  category: fallback(z.string(), "").default(""),
  sort: fallback(sortEnum, "new").default("new"),
  page: fallback(z.number().int().min(1), 1).default(1),
  min: fallback(z.number().min(0), 0).default(0),
  max: fallback(z.number().min(0), 0).default(0),
  stock: fallback(z.enum(["all", "in"]), "all").default("all"),
  offers: fallback(z.enum(["all", "yes"]), "all").default("all"),
  rating: fallback(z.number().min(0).max(5), 0).default(0),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(shopSearchSchema),
  head: () => ({
    meta: [
      { title: "المتجر | تسوق الكتب العربية | مكتبة المتسولين" },
      { name: "description", content: "تصفح كل كتب مكتبة المتسولين: روايات، أدب، تنمية ذاتية، تاريخ، فلسفة وغيرها. توصيل لكل مصر ودفع عند الاستلام." },
      { property: "og:title", content: "المتجر | مكتبة المتسولين" },
      { property: "og:description", content: "تصفح آلاف الكتب العربية والمترجمة بأسعار مميزة." },
      { property: "og:url", content: "https://www.almotasolen.com/shop" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/shop" }],
  }),
  component: Shop,
});


function Shop() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const cat = search.category || null;

  const updateSearch = (patch: Record<string, any>, resetPage = true) =>
    navigate({
      search: (prev: any) => ({ ...prev, ...patch, ...(resetPage ? { page: 1 } : {}) }),
      replace: true,
    });

  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchProducts = useServerFn(listProductsPublic);
  const fetchCats = useServerFn(listCategoriesPublic);

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const { data, isLoading } = useQuery({
    queryKey: ["products", "shop", cat],
    queryFn: () => fetchProducts({ data: cat ? { category_slug: cat } : {} }),
  });

  // Bounds for the price slider based on current dataset
  const bounds = useMemo(() => {
    const prices = (data?.products ?? []).map((p) => Number(p.price)).filter((n) => !isNaN(n));
    if (!prices.length) return { min: 0, max: 1000 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [data]);

  const minPrice = search.min || bounds.min;
  const maxPrice = search.max || bounds.max;

  const filteredSorted = useMemo(() => {
    let list = [...(data?.products ?? [])];
    // Filters
    list = list.filter((p) => {
      const price = Number(p.price);
      if (price < minPrice || price > maxPrice) return false;
      if (search.stock === "in" && !p.unlimited_stock && p.stock <= 0) return false;
      if (search.offers === "yes" && !(p.compare_at_price && Number(p.compare_at_price) > price))
        return false;
      if (search.rating > 0 && (p.rating || 0) < search.rating) return false;
      return true;
    });
    // Sort
    if (search.sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (search.sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (search.sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [data, search.sort, minPrice, maxPrice, search.stock, search.offers, search.rating]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PER_PAGE));
  const currentPage = Math.min(search.page, totalPages);

  // If page is out of range after filtering, reset it
  useEffect(() => {
    if (search.page > totalPages) {
      navigate({ search: (prev: any) => ({ ...prev, page: 1 }), replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredSorted.slice(start, start + PER_PAGE);
  }, [filteredSorted, currentPage]);

  const clearAll = () =>
    navigate({
      search: { category: cat ?? "", sort: "new", page: 1, min: 0, max: 0, stock: "all", offers: "all", rating: 0 } as any,
      replace: true,
    });

  const hasActiveFilters =
    (search.min && search.min !== bounds.min) ||
    (search.max && search.max !== bounds.max) ||
    search.stock !== "all" ||
    search.offers !== "all" ||
    search.rating > 0;

  const FiltersPanel = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-display font-bold mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {isAr ? "التصنيفات" : "Categories"}
        </h3>
        <div className="space-y-1 max-h-64 overflow-y-auto pe-1">
          <button
            onClick={() => updateSearch({ category: "" })}
            className={`block w-full text-start px-3 py-2 rounded-md text-sm ${!cat ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {(catData?.categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => updateSearch({ category: c.slug })}
              className={`block w-full text-start px-3 py-2 rounded-md text-sm ${cat === c.slug ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}
            >
              {isAr ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-display font-bold mb-3">{isAr ? "السعر (ج.م)" : "Price (EGP)"}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={bounds.min}
            max={bounds.max}
            value={search.min || ""}
            placeholder={String(bounds.min)}
            onChange={(e) => updateSearch({ min: Number(e.target.value) || 0 })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            min={bounds.min}
            max={bounds.max}
            value={search.max || ""}
            placeholder={String(bounds.max)}
            onChange={(e) => updateSearch({ max: Number(e.target.value) || 0 })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-display font-bold mb-3">{isAr ? "التوفر" : "Availability"}</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={search.stock === "in"}
            onChange={(e) => updateSearch({ stock: e.target.checked ? "in" : "all" })}
            className="h-4 w-4 accent-primary"
          />
          {isAr ? "المتوفر فقط" : "In stock only"}
        </label>
      </div>

      {/* Offers */}
      <div>
        <h3 className="font-display font-bold mb-3">{isAr ? "العروض" : "Offers"}</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={search.offers === "yes"}
            onChange={(e) => updateSearch({ offers: e.target.checked ? "yes" : "all" })}
            className="h-4 w-4 accent-primary"
          />
          {isAr ? "عروض وتخفيضات فقط" : "On sale only"}
        </label>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-display font-bold mb-3">{isAr ? "التقييم" : "Rating"}</h3>
        <div className="space-y-1">
          {[4, 3, 2, 1, 0].map((r) => (
            <button
              key={r}
              onClick={() => updateSearch({ rating: r })}
              className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm ${search.rating === r ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}
            >
              {r === 0 ? (
                <span>{isAr ? "الكل" : "All"}</span>
              ) : (
                <>
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r ? "fill-warning text-warning" : "text-muted-foreground"}`}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">{isAr ? "فأكثر" : "& up"}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="w-full h-10 rounded-md border border-input text-sm font-semibold hover:bg-muted flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          {isAr ? "مسح الفلاتر" : "Clear filters"}
        </button>
      )}
    </div>
  );

  const startIdx = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const endIdx = Math.min(currentPage * PER_PAGE, filteredSorted.length);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl md:text-5xl mb-2">
          {isAr ? "كل الكتب" : "All books"}
        </h1>
        <p className="text-muted-foreground">
          {isAr
            ? `عرض ${startIdx}-${endIdx} من ${filteredSorted.length} كتاب`
            : `Showing ${startIdx}-${endIdx} of ${filteredSorted.length} books`}
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            {FiltersPanel}
          </div>
        </aside>

        <div>
          {/* Top bar: sort + mobile filters trigger */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden h-10 px-4 rounded-md border border-input bg-background text-sm font-semibold flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isAr ? "الفلاتر" : "Filters"}
            </button>
            <div className="lg:ms-auto flex items-center gap-2">
              <label className="text-sm text-muted-foreground hidden sm:inline">
                {isAr ? "ترتيب حسب" : "Sort by"}
              </label>
              <select
                value={search.sort}
                onChange={(e) => updateSearch({ sort: e.target.value })}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="new">{isAr ? "الأحدث" : "Newest"}</option>
                <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: low to high"}</option>
                <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: high to low"}</option>
                <option value="rating">{isAr ? "التقييم" : "Rating"}</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : filteredSorted.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground mb-4">
                {isAr ? "لا توجد كتب مطابقة للفلاتر." : "No books match your filters."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="text-primary font-semibold text-sm hover:underline"
                >
                  {isAr ? "مسح الفلاتر" : "Clear filters"}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {paginated.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={(p) => {
                    navigate({ search: (prev: any) => ({ ...prev, page: p }), replace: false });
                    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  isAr={isAr}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="absolute inset-y-0 end-0 w-full max-w-sm bg-background shadow-2xl flex flex-col animate-in slide-in-from-right">
            <header className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-extrabold text-xl">{isAr ? "الفلاتر" : "Filters"}</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-2 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{FiltersPanel}</div>
            <footer className="p-4 border-t border-border">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground font-bold"
              >
                {isAr ? `عرض النتائج (${filteredSorted.length})` : `Show results (${filteredSorted.length})`}
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
  isAr,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  isAr: boolean;
}) {
  const pages = getPageWindow(page, totalPages);
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1.5 flex-wrap"
      aria-label={isAr ? "التنقل بين الصفحات" : "Pagination"}
    >
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="h-10 w-10 grid place-items-center rounded-md border border-input bg-background disabled:opacity-40 hover:bg-muted"
        aria-label={isAr ? "السابق" : "Previous"}
      >
        <PrevIcon className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`h-10 min-w-10 px-3 rounded-md text-sm font-semibold ${
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-muted"
            }`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="h-10 w-10 grid place-items-center rounded-md border border-input bg-background disabled:opacity-40 hover:bg-muted"
        aria-label={isAr ? "التالي" : "Next"}
      >
        <NextIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}

function getPageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}
