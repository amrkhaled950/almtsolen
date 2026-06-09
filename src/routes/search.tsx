import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useLocale } from "../lib/i18n";
import { ProductCard } from "../components/product/ProductCard";
import { ProductGridSkeleton } from "../components/ui/skeletons";
import {
  searchProductsPublic,
  listCategoriesPublic,
} from "../lib/catalog.functions";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  min_price: fallback(z.number().nonnegative(), 0).default(0),
  max_price: fallback(z.number().nonnegative(), 0).default(0),
  min_rating: fallback(z.number().min(0).max(5), 0).default(0),
  in_stock: fallback(z.boolean(), false).default(false),
  sort: fallback(
    z.enum(["relevance", "new", "price-asc", "price-desc", "rating"]),
    "relevance",
  ).default("relevance"),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "البحث | مكتبة المتسولين" },
      {
        name: "description",
        content: "ابحث عن كتبك المفضلة في مكتبة المتسولين بالعنوان، المؤلف، أو دار النشر.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [qInput, setQInput] = useState(search.q);

  useEffect(() => {
    setQInput(search.q);
  }, [search.q]);

  const fetchSearch = useServerFn(searchProductsPublic);
  const fetchCats = useServerFn(listCategoriesPublic);

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCats(),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "search",
      search.q,
      search.category,
      search.min_price,
      search.max_price,
      search.min_rating,
      search.in_stock,
      search.sort,
    ],
    queryFn: () =>
      fetchSearch({
        data: {
          q: search.q || undefined,
          category_slug: search.category || undefined,
          min_price: search.min_price > 0 ? search.min_price : undefined,
          max_price: search.max_price > 0 ? search.max_price : undefined,
          min_rating: search.min_rating > 0 ? search.min_rating : undefined,
          in_stock: search.in_stock || undefined,
          sort: search.sort,
        },
      }),
  });

  const products = data?.products ?? [];

  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (prev: any) => ({ ...prev, ...patch }), replace: true });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: qInput.trim() });
  };

  const hasFilters =
    !!search.category ||
    search.min_price > 0 ||
    search.max_price > 0 ||
    search.min_rating > 0 ||
    search.in_stock;

  return (
    <div className="container-page py-8 md:py-10">
      <form onSubmit={onSubmit} className="mb-6">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute top-1/2 -translate-y-1/2 start-4 h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={isAr ? "ابحث عن كتاب، مؤلف، أو دار نشر..." : "Search books, authors, publishers..."}
            className="w-full h-12 ps-12 pe-28 rounded-full bg-muted border border-transparent focus:border-primary focus:bg-background focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="absolute top-1/2 -translate-y-1/2 end-2 h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover"
          >
            {isAr ? "بحث" : "Search"}
          </button>
        </div>
      </form>

      <div className="mb-6">
        <h1 className="font-display font-black text-2xl md:text-3xl mb-1">
          {search.q
            ? isAr
              ? `نتائج البحث عن "${search.q}"`
              : `Results for "${search.q}"`
            : isAr
              ? "تصفح كل الكتب"
              : "Browse all books"}
        </h1>
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {products.length} {isAr ? "نتيجة" : "results"}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              {isAr ? "الفلاتر" : "Filters"}
              {hasFilters && (
                <button
                  type="button"
                  onClick={() =>
                    update({
                      category: "",
                      min_price: 0,
                      max_price: 0,
                      min_rating: 0,
                      in_stock: false,
                    })
                  }
                  className="ms-auto text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                >
                  <X className="h-3 w-3" /> {isAr ? "مسح" : "Clear"}
                </button>
              )}
            </h3>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                {isAr ? "التصنيف" : "Category"}
              </label>
              <select
                value={search.category}
                onChange={(e) => update({ category: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">{isAr ? "كل التصنيفات" : "All categories"}</option>
                {(catData?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.slug}>
                    {isAr ? c.name_ar : c.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                {isAr ? "السعر (ج.م)" : "Price (EGP)"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={isAr ? "من" : "Min"}
                  value={search.min_price || ""}
                  onChange={(e) =>
                    update({ min_price: Number(e.target.value) || 0 })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="number"
                  min={0}
                  placeholder={isAr ? "إلى" : "Max"}
                  value={search.max_price || ""}
                  onChange={(e) =>
                    update({ max_price: Number(e.target.value) || 0 })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                {isAr ? "التقييم" : "Rating"}
              </label>
              <div className="space-y-1">
                {[0, 4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update({ min_rating: r })}
                    className={`block w-full text-start px-3 py-1.5 rounded-md text-sm ${
                      search.min_rating === r
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted"
                    }`}
                  >
                    {r === 0
                      ? isAr
                        ? "أي تقييم"
                        : "Any rating"
                      : isAr
                        ? `${r} نجوم فأكثر`
                        : `${r}★ & up`}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={search.in_stock}
                onChange={(e) => update({ in_stock: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">
                {isAr ? "المتوفر فقط" : "In stock only"}
              </span>
            </label>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-end mb-5">
            <select
              value={search.sort}
              onChange={(e) => update({ sort: e.target.value as any })}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="relevance">{isAr ? "الأكثر صلة" : "Relevance"}</option>
              <option value="new">{isAr ? "الأحدث" : "Newest"}</option>
              <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: low to high"}</option>
              <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: high to low"}</option>
              <option value="rating">{isAr ? "التقييم" : "Rating"}</option>
            </select>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-bold mb-1">
                {isAr ? "لا توجد نتائج" : "No results"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "جرّب كلمات بحث مختلفة أو امسح الفلاتر."
                  : "Try different keywords or clear filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
