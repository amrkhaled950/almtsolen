import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "الشحن والتوصيل | مكتبة روبن هود" },
      { name: "description", content: "معلومات الشحن والتوصيل لكل محافظات مصر من مكتبة روبن هود — أسعار ومدد التوصيل والدفع عند الاستلام." },
      { property: "og:title", content: "الشحن والتوصيل | مكتبة روبن هود" },
      { property: "og:description", content: "نوصل لكل مصر مع الدفع عند الاستلام." },
      { property: "og:url", content: "https://www.almotasolen.com/shipping" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/shipping" }],
  }),
  component: () => (
    <PolicyPage arField="shipping_policy_ar" enField="shipping_policy_en" titleAr="الشحن والتوصيل" titleEn="Shipping & Delivery" />
  ),
});
