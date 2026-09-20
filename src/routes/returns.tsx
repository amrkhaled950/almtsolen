import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "سياسة الاسترجاع والاستبدال | مكتبة روبن هود" },
      { name: "description", content: "تعرف على سياسة استرجاع واستبدال الكتب في مكتبة روبن هود خلال 14 يوم من تاريخ الاستلام." },
      { property: "og:title", content: "الاسترجاع والاستبدال | مكتبة روبن هود" },
      { property: "og:description", content: "سياسة مرنة لاسترجاع واستبدال الكتب." },
      { property: "og:url", content: "https://www.almotasolen.com/returns" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/returns" }],
  }),
  component: () => (
    <PolicyPage arField="refund_policy_ar" enField="refund_policy_en" titleAr="سياسة الاسترجاع والاستبدال" titleEn="Returns & Refunds" />
  ),
});
