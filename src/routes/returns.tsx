import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "سياسة الاسترجاع | مكتبة المتسولين" }] }),
  component: () => (
    <PolicyPage arField="refund_policy_ar" enField="refund_policy_en" titleAr="سياسة الاسترجاع والاستبدال" titleEn="Returns & Refunds" />
  ),
});
