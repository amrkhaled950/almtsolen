import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام | مكتبة المتسولين" },
      { name: "description", content: "الشروط والأحكام الخاصة باستخدام موقع مكتبة المتسولين والشراء منه." },
      { property: "og:title", content: "الشروط والأحكام | مكتبة المتسولين" },
      { property: "og:description", content: "شروط استخدام الموقع وسياسة الشراء." },
      { property: "og:url", content: "https://www.almotasolen.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/terms" }],
  }),
  component: () => (
    <PolicyPage arField="terms_ar" enField="terms_en" titleAr="الشروط والأحكام" titleEn="Terms & Conditions" />
  ),
});
