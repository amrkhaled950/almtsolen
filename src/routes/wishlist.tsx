import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocale } from "../lib/i18n";
import { useWishlist } from "../lib/cart-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "المفضلة | المتسولين" }] }),
  component: () => {
    const locale = useLocale((s) => s.locale);
    const ids = useWishlist((s) => s.ids);
    return (
      <div className="container-page py-12">
        <h1 className="font-display font-black text-4xl mb-8">
          {locale === "ar" ? "قائمة المفضلة" : "Wishlist"}
        </h1>
        {ids.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {locale === "ar" ? "قائمتك فارغة" : "Empty"}
            </p>
            <Link to="/shop" className="text-primary font-semibold">
              {locale === "ar" ? "تصفح المتجر" : "Browse shop"}
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {locale === "ar"
              ? `لديك ${ids.length} منتج في المفضلة — سيتم عرضها قريبًا.`
              : `You have ${ids.length} items in your wishlist.`}
          </div>
        )}
      </div>
    );
  },
});
