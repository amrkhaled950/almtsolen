import { Link } from "@tanstack/react-router";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../../lib/cart-store";
import { useLocale, formatPrice } from "../../lib/i18n";
import { useEffect } from "react";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, subtotal } = useCart();
  const locale = useLocale((s) => s.locale);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const total = subtotal();
  const freeShippingThreshold = 500;
  const remaining = Math.max(0, freeShippingThreshold - total);
  const progress = Math.min(100, (total / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-in fade-in"
        onClick={closeCart}
      />
      <aside className="absolute inset-y-0 end-0 w-full max-w-md bg-background shadow-2xl flex flex-col animate-in slide-in-from-right">
        <header className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-extrabold text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {locale === "ar" ? "سلة التسوق" : "Your cart"}
            <span className="text-sm font-normal text-muted-foreground">
              ({items.length})
            </span>
          </h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Free shipping bar */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-accent/50 border-b border-border">
            {remaining > 0 ? (
              <p className="text-xs font-medium mb-1.5">
                {locale === "ar"
                  ? `أضف ${formatPrice(remaining, locale)} لتحصل على شحن مجاني 🚚`
                  : `Add ${formatPrice(remaining, locale)} more for free shipping 🚚`}
              </p>
            ) : (
              <p className="text-xs font-bold text-success mb-1.5">
                {locale === "ar" ? "🎉 حصلت على شحن مجاني!" : "🎉 You got free shipping!"}
              </p>
            )}
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-muted mb-4">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-display font-bold text-lg mb-2">
              {locale === "ar" ? "سلتك فارغة" : "Your cart is empty"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {locale === "ar" ? "تصفح كتبنا وأضف ما يعجبك" : "Browse our books"}
            </p>
            <Link
              to="/shop"
              onClick={closeCart}
              className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors"
            >
              {locale === "ar" ? "تسوّق الآن" : "Shop now"}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.map((item) => {
                const title = locale === "ar" ? item.product.title_ar : item.product.title_en;
                const author = locale === "ar" ? item.product.author_ar : item.product.author_en;
                return (
                <div key={item.product.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                  <Link
                    to="/product/$slug"
                    params={{ slug: item.product.slug }}
                    onClick={closeCart}
                    className="shrink-0"
                  >
                    <img
                      src={item.product.cover_url ?? ""}
                      alt=""
                      className="h-24 w-18 rounded-md object-cover shadow-card-soft bg-muted"
                      style={{ width: 72 }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.product.slug }}
                      onClick={closeCart}
                      className="font-display font-bold text-sm leading-tight hover:text-primary line-clamp-2"
                    >
                      {title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">{author}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 border border-border rounded-md">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">
                          {formatPrice(Number(item.product.price) * item.quantity, locale)}
                        </span>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <footer className="border-t border-border p-5 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {locale === "ar" ? "المجموع الفرعي" : "Subtotal"}
                </span>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(total, locale)}
                </span>
              </div>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full h-12 rounded-md bg-primary text-primary-foreground font-bold text-center leading-[3rem] hover:bg-primary-hover transition-colors"
              >
                {locale === "ar" ? "إتمام الشراء" : "Checkout"}
              </Link>
              <button
                onClick={closeCart}
                className="block w-full text-sm text-muted-foreground hover:text-primary"
              >
                {locale === "ar" ? "متابعة التسوق" : "Continue shopping"}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
