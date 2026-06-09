import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User, Menu, X, Globe, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLocale, t } from "../../lib/i18n";
import { useCart } from "../../lib/cart-store";
import { cn } from "../../lib/utils";
import { listCategoriesPublic } from "../../lib/catalog.functions";
import { PromoModal } from "./PromoModal";

export function SiteHeader() {
  const { locale, setLocale } = useLocale();
  const cartCount = useCart((s) => s.count());
  const openCart = useCart((s) => s.openCart);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  const fetchCats = useServerFn(listCategoriesPublic);
  const { data: catData } = useQuery({ queryKey: ["categories-nav"], queryFn: () => fetchCats() });

  const allCats = (catData?.categories ?? []) as any[];
  const navCats = allCats
    .filter((c) => !c.parent_id && c.show_in_nav !== false && c.is_active)
    .sort((a, b) => (a.nav_order ?? a.display_order ?? 0) - (b.nav_order ?? b.display_order ?? 0));
  const subCatsOf = (pid: string) =>
    allCats.filter((c) => c.parent_id === pid && c.is_active)
      .sort((a, b) => (a.nav_order ?? 0) - (b.nav_order ?? 0));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { to: "/", key: "nav.home" as const },
    { to: "/shop", key: "nav.shop" as const },
    { to: "/about", key: "nav.about" as const },
    { to: "/contact", key: "nav.contact" as const },
  ];

  return (
    <>
      <PromoModal />

      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs">
        <div className="container-page flex h-9 items-center justify-between">
          <span className="font-medium">
            {locale === "ar" ? "🚚 شحن مجاني للطلبات فوق 2000 ج.م" : "🚚 Free shipping on orders over 2000 EGP"}
          </span>
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity"
            aria-label="Toggle language"
          >
            <Globe className="h-3.5 w-3.5" />
            {locale === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>

      <header className={cn(
        "sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md transition-shadow",
        scrolled && "shadow-card-soft",
      )}>
        <div className="container-page flex h-16 md:h-20 items-center gap-4 md:gap-8">
          {/* Mobile menu trigger */}
          <button className="lg:hidden -ms-2 p-2" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="مكتبة المتسولين" className="h-12 w-12 md:h-14 md:w-14 object-contain" />
            <div className="hidden sm:block">
              <div className="font-display font-extrabold text-lg leading-none text-primary">
                {locale === "ar" ? "مكتبة المتسولين" : "Al-Motasawelin Library"}
              </div>
              <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
                {locale === "ar" ? "للكتب العربية" : "Arabic Books"}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to}
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md"
                activeProps={{ className: "text-primary" }}>
                {t(l.key, locale)}
              </Link>
            ))}

            {/* Categories dropdown */}
            {navCats.length > 0 && (
              <div ref={catRef} className="relative">
                <button
                  onClick={() => setCatOpen(!catOpen)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md",
                    catOpen && "text-primary"
                  )}
                >
                  {locale === "ar" ? "التصنيفات" : "Categories"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", catOpen && "rotate-180")} />
                </button>

                {catOpen && (
                  <div className="absolute top-full start-0 mt-1 bg-background border border-border rounded-2xl shadow-elegant z-50 min-w-[600px] p-4">
                    <div className={cn(
                      "grid gap-2",
                      navCats.length <= 3 ? "grid-cols-1" :
                      navCats.length <= 6 ? "grid-cols-2" : "grid-cols-3"
                    )}>
                      {navCats.map((cat) => {
                        const subs = subCatsOf(cat.id);
                        return (
                          <div key={cat.id}>
                            <Link
                              to="/shop"
                              search={{ category: cat.slug } as any}
                              onClick={() => setCatOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted font-semibold text-sm group"
                            >
                              <span className="text-xl">{cat.icon || cat.image_url || "📖"}</span>
                              <span>{locale === "ar" ? cat.name_ar : cat.name_en}</span>
                            </Link>
                            {subs.map((sub) => (
                              <Link
                                key={sub.id}
                                to="/shop"
                                search={{ category: sub.slug } as any}
                                onClick={() => setCatOpen(false)}
                                className="flex items-center gap-2 ps-9 pe-3 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground hover:text-foreground"
                              >
                                <span>{sub.icon || sub.image_url || "·"}</span>
                                {locale === "ar" ? sub.name_ar : sub.name_en}
                              </Link>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <Link to="/categories" onClick={() => setCatOpen(false)}
                        className="text-xs text-primary font-semibold hover:underline">
                        {locale === "ar" ? "عرض كل التصنيفات ←" : "View all categories →"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder={t("nav.search", locale)}
                className="w-full h-10 ps-10 pe-4 rounded-full bg-muted text-sm border border-transparent focus:border-primary focus:bg-background focus:outline-none transition-colors" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link to="/account" className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition-colors" aria-label={t("nav.account", locale)}>
              <User className="h-5 w-5" />
            </Link>
            <Link to="/wishlist" className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition-colors" aria-label={t("nav.wishlist", locale)}>
              <Heart className="h-5 w-5" />
            </Link>
            <button onClick={openCart} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition-colors" aria-label={t("nav.cart", locale)}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden border-t border-border/60 px-4 py-2">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input type="search" placeholder={t("nav.search", locale)}
              className="w-full h-9 ps-10 pe-4 rounded-full bg-muted text-sm focus:outline-none" />
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-display font-extrabold text-lg">{locale === "ar" ? "القائمة" : "Menu"}</div>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-md" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-md font-medium hover:bg-muted">
                  {t(l.key, locale)}
                </Link>
              ))}
              {navCats.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                    {locale === "ar" ? "التصنيفات" : "Categories"}
                  </div>
                  {navCats.map((cat) => {
                    const subs = subCatsOf(cat.id);
                    return (
                      <div key={cat.id}>
                        <Link to="/shop" search={{ category: cat.slug } as any} onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md font-medium hover:bg-muted">
                          <span>{cat.icon || cat.image_url || "📖"}</span>
                          {locale === "ar" ? cat.name_ar : cat.name_en}
                        </Link>
                        {subs.map((sub) => (
                          <Link key={sub.id} to="/shop" search={{ category: sub.slug } as any} onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 ps-8 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
                            <span className="text-xs">{sub.icon || "·"}</span>
                            {locale === "ar" ? sub.name_ar : sub.name_en}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
