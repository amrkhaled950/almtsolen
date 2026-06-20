import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useLocale } from "../lib/i18n";
import { useWishlist } from "../lib/cart-store";
import { useAuth } from "../lib/auth-store";
import { getMyWishlist, syncWishlist } from "../lib/wishlist.functions";
import { ProductCard } from "../components/product/ProductCard";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "قائمة المفضلة | مكتبة المتسولين" },
      { name: "description", content: "احفظ كتبك المفضلة في مكتبة المتسولين بمكان واحد لتعود إليها لاحقاً وتشتريها وقتما تريد." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "قائمة المفضلة | مكتبة المتسولين" },
      { property: "og:description", content: "كل الكتب اللي حفظتها في قائمة مفضلتك على مكتبة المتسولين." },
      { property: "og:url", content: "https://www.almotasolen.com/wishlist" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/wishlist" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const ids = useWishlist((s) => s.ids);
  const setIds = useWishlist((s) => s.setIds);
  const userId = useAuth((s) => s.user?.id);
  const initialized = useAuth((s) => s.initialized);

  const fetchWishlist = useServerFn(getMyWishlist);
  const syncFn = useServerFn(syncWishlist);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-wishlist", userId],
    queryFn: () => fetchWishlist(),
    enabled: !!userId,
  });

  // Sync local ids to server on login (merge), then replace local with server list
  useEffect(() => {
    if (!userId || !data) return;
    const serverIds = data.products.map((p) => p.id);
    const localOnly = ids.filter((x) => !serverIds.includes(x));
    if (localOnly.length > 0) {
      syncFn({ data: { product_ids: localOnly } })
        .then(() => refetch())
        .catch(() => {});
    } else {
      setIds(serverIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, data?.products.length]);

  if (!initialized) {
    return <div className="container-page py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!userId) {
    if (ids.length === 0) return <Empty isAr={isAr} />;
    return (
      <div className="container-page py-12">
        <h1 className="font-display font-black text-4xl mb-3">{isAr ? "قائمة المفضلة" : "Wishlist"}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          <Link to="/auth" className="text-primary font-semibold">{isAr ? "سجّل دخول" : "Sign in"}</Link>{" "}
          {isAr ? "لمزامنة قائمتك عبر أجهزتك." : "to sync across devices."}
        </p>
        <p className="text-muted-foreground">{isAr ? `لديك ${ids.length} منتج محفوظ محلياً.` : `${ids.length} items saved locally.`}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container-page py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const products = data?.products ?? [];
  if (products.length === 0) return <Empty isAr={isAr} />;

  return (
    <div className="container-page py-12">
      <h1 className="font-display font-black text-4xl mb-8">{isAr ? "قائمة المفضلة" : "Wishlist"}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((p: any, i: number) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}

function Empty({ isAr }: { isAr: boolean }) {
  return (
    <div className="container-page py-12">
      <h1 className="font-display font-black text-4xl mb-8">{isAr ? "قائمة المفضلة" : "Wishlist"}</h1>
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">{isAr ? "قائمتك فارغة" : "Empty"}</p>
        <Link to="/shop" className="text-primary font-semibold">{isAr ? "تصفح المتجر" : "Browse shop"}</Link>
      </div>
    </div>
  );
}
