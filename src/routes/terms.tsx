import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام | مكتبة روبن هود" },
      { name: "description", content: "الشروط والأحكام الخاصة باستخدام موقع مكتبة روبن هود والشراء منه." },
      { property: "og:title", content: "الشروط والأحكام | مكتبة روبن هود" },
      { property: "og:description", content: "شروط استخدام الموقع وسياسة الشراء." },
      { property: "og:url", content: "https://www.almotasolen.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/terms" }],
  }),
  component: () => (
    <PolicyPage arField="terms_ar" enField="terms_en" titleAr="الشروط والأحكام" titleEn="Terms & Conditions" />
  ),
});
