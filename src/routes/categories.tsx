import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "../lib/i18n";
import { listCategoriesPublic } from "../lib/catalog.functions";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "التصنيفات | تصفح أقسام الكتب | مكتبة المتسولين" },
      { name: "description", content: "تصفح جميع تصنيفات الكتب في مكتبة المتسولين: روايات، أدب، تنمية، تاريخ، فلسفة، علوم وأكثر." },
      { property: "og:title", content: "كل تصنيفات الكتب | مكتبة المتسولين" },
      { property: "og:description", content: "اكتشف الكتب حسب التصنيف بسهولة." },
      { property: "og:url", content: "https://www.almotasolen.com/categories" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/categories" }],
  }),
  component: Categories,
});


function Categories() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const fetchCats = useServerFn(listCategoriesPublic);
  const { data } = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });
  const cats = data?.categories ?? [];

  return (
    <div className="container-page py-12">
      <h1 className="font-display font-black text-3xl md:text-5xl mb-8">{isAr ? "كل التصنيفات" : "All categories"}</h1>
      {cats.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">{isAr ? "لا توجد تصنيفات حالياً." : "No categories yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map((c) => (
            <Link key={c.id} to="/shop" className="block bg-card border border-border rounded-2xl p-8 text-center hover:shadow-elegant hover:-translate-y-1 transition-all">
              <h3 className="font-display font-bold text-lg">{isAr ? c.name_ar : c.name_en}</h3>
              {(isAr ? c.description_ar : c.description_en) && (
                <p className="text-sm text-muted-foreground mt-2">{isAr ? c.description_ar : c.description_en}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
