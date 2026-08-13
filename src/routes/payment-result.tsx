import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2, XCircle, ShoppingCart, RotateCcw } from "lucide-react";
import { useLocale } from "../lib/i18n";
import { useCart } from "../lib/cart-store";
import { confirmKashierPayment } from "../lib/kashier.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/payment-result")({
  head: () => ({
    meta: [
      { title: "نتيجة الدفع | مكتبة المتسولين" },
      { name: "description", content: "حالة عملية الدفع الخاصة بطلبك من مكتبة المتسولين." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "نتيجة الدفع | مكتبة المتسولين" },
      { property: "og:description", content: "حالة عملية الدفع الخاصة بطلبك من مكتبة المتسولين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    paymentStatus: typeof search["paymentStatus"] === "string" ? (search["paymentStatus"] as string) : "",
    merchantOrderId:
      typeof search["merchantOrderId"] === "string" ? (search["merchantOrderId"] as string) : "",
  }),
  component: PaymentResult,
});

function PaymentResult() {
  const { paymentStatus, merchantOrderId } = Route.useSearch();
  const isAr = useLocale((s) => s.locale === "ar");
  const statusStr = (paymentStatus || "").toUpperCase();
  const success = statusStr === "SUCCESS" || statusStr === "SUCCESSFUL";
  const clear = useCart((s) => s.clear);
  const closeCart = useCart((s) => s.closeCart);
  const navigate = useNavigate();
  const confirmFn = useServerFn(confirmKashierPayment);

  // لو الدفع نجح — حدث حالة الطلب في الداتابيز وامسح العربة
  useEffect(() => {
    if (success && merchantOrderId) {
      confirmFn({ data: { paymentStatus, merchantOrderId } }).catch(() => {});
      clear();
      closeCart();
    }
  }, [success, merchantOrderId]);

  return (
    <div className="container-page py-20">
      <div className="max-w-md mx-auto text-center bg-card border border-border rounded-3xl p-10 shadow-elegant">
        <div
          className={`grid h-16 w-16 mx-auto place-items-center rounded-full mb-4 ${
            success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          {success ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
        </div>

        <h1 className="font-display font-black text-2xl mb-2">
          {success
            ? isAr ? "تم الدفع بنجاح!" : "Payment successful!"
            : isAr ? "لم تكتمل عملية الدفع" : "Payment failed"}
        </h1>

        {merchantOrderId && (
          <p className="text-muted-foreground mb-1">
            {isAr ? "رقم الطلب" : "Order number"}:{" "}
            <span className="font-bold text-primary">{merchantOrderId}</span>
          </p>
        )}

        <p className="text-sm text-muted-foreground my-6">
          {success
            ? isAr
              ? "سنتواصل معك لتأكيد موعد التوصيل."
              : "We will contact you to confirm delivery."
            : isAr
              ? "لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى بنفس المنتجات أو اختيار الدفع عند الاستلام."
              : "No charge was made. You can retry with the same items or choose cash on delivery."}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {success ? (
            <>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
              >
                {isAr ? "الرئيسية" : "Home"}
              </Link>
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-md border border-input px-6 py-2.5 text-sm font-medium"
              >
                {isAr ? "طلباتي" : "My orders"}
              </Link>
            </>
          ) : (
            <>
              {/* زر الرجوع للـ Checkout — العربة لا تزال موجودة */}
              <Link
                to="/checkout"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                {isAr ? "حاول مرة أخرى" : "Try again"}
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input px-6 py-2.5 text-sm font-medium"
              >
                <ShoppingCart className="h-4 w-4" />
                {isAr ? "متابعة التسوق" : "Continue shopping"}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
