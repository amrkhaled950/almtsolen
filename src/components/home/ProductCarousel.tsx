import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ProductCard } from "../product/ProductCard";

type Product = { id: string } & Record<string, any>;

export function ProductCarousel({
  title,
  viewAllHref,
  viewAllSearch,
  products,
  loading,
  isAr,
  icon,
}: {
  title: string;
  viewAllHref?: string;
  viewAllSearch?: Record<string, any>;
  products: Product[];
  loading?: boolean;
  isAr: boolean;
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const dist = el.clientWidth * 0.85 * (isAr ? -dir : dir);
    el.scrollBy({ left: dist, behavior: "smooth" });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="container-page py-10">
      <div className="flex items-end justify-between mb-5 gap-3">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl flex items-center gap-2 min-w-0">
          {icon}
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {viewAllHref && (
            <Link
              to={viewAllHref as any}
              search={viewAllSearch as any}
              className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
            >
              {isAr ? "عرض الكل" : "View all"}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          )}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scroll(-1)}
              aria-label="prev"
              className="h-9 w-9 rounded-full border border-border bg-card hover:bg-muted grid place-items-center"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="next"
              className="h-9 w-9 rounded-full border border-border bg-card hover:bg-muted grid place-items-center"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div
          ref={ref}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {products.map((p, i) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[46%] sm:w-[32%] md:w-[24%] lg:w-[19%]"
            >
              <ProductCard product={p as any} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
