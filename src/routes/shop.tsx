import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useLocale } from "../lib/i18n";
import { ProductCard } from "../components/product/ProductCard";
import { listProductsPublic, listCategoriesPublic } from "../lib/catalog.functions";
import { SlidersHorizontal } from "lucide-react";
import { ProductGridSkeleton } from "../components/ui/skeletons";

const shopSearchSchema = z.object({
  category: fallback(z.string(), "").default(""),
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
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const cat = category || null;
  const setCat = (next: string | null) =>
    navigate({ search: { category: next ?? "" } as any, replace: true });
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc" | "rating">("new");

  const fetchProducts = useServerFn(listProductsPublic);
  const fetchCats = useServerFn(listCategoriesPublic);

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const { data, isLoading } = useQuery({
    queryKey: ["products", "shop", cat],
    queryFn: () => fetchProducts({ data: cat ? { category_slug: cat } : {} }),
  });

  const filtered = useMemo(() => {
    const list = [...(data?.products ?? [])];
    if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [data, sort]);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl md:text-5xl mb-2">{isAr ? "كل الكتب" : "All books"}</h1>
        <p className="text-muted-foreground">{filtered.length} {isAr ? "كتاب" : "books"}</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display font-bold mb-4 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />{isAr ? "التصنيفات" : "Categories"}</h2>
            <button onClick={() => setCat(null)} className={`block w-full text-start px-3 py-2 rounded-md text-sm mb-1 ${!cat ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>{isAr ? "الكل" : "All"}</button>
            {(catData?.categories ?? []).map((c) => (
              <button key={c.id} onClick={() => setCat(c.slug)} className={`block w-full text-start px-3 py-2 rounded-md text-sm ${cat === c.slug ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>
                {isAr ? c.name_ar : c.name_en}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-5">
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="new">{isAr ? "الأحدث" : "Newest"}</option>
              <option value="price-asc">{isAr ? "السعر: الأقل" : "Price: low to high"}</option>
              <option value="price-desc">{isAr ? "السعر: الأعلى" : "Price: high to low"}</option>
              <option value="rating">{isAr ? "التقييم" : "Rating"}</option>
            </select>
          </div>
          {isLoading ? (
            <ProductGridSkeleton count={8} />

          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground">{isAr ? "لا توجد كتب متاحة حالياً." : "No books available."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
