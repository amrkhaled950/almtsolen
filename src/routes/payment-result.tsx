import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLocale } from "../lib/i18n";

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
  const success = paymentStatus.toUpperCase() === "SUCCESS";

  return (
    <div className="container-page py-20">
      <div className="max-w-md mx-auto text-center bg-card border border-border rounded-3xl p-10 shadow-elegant">
        <div
          className={`grid h-16 w-16 mx-auto place-items-center rounded-full mb-4 ${success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
        >
          {success ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
        </div>
        <h1 className="font-display font-black text-2xl mb-2">
          {success
            ? isAr
              ? "تم الدفع بنجاح!"
              : "Payment successful!"
            : isAr
              ? "لم تكتمل عملية الدفع"
              : "Payment failed"}
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
              ? "يمكنك المحاولة مرة أخرى أو اختيار الدفع عند الاستلام."
              : "You can try again or choose cash on delivery."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
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
        </div>
      </div>
    </div>
  );
}
