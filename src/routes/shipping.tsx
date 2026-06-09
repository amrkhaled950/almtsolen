import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "الشحن والتوصيل | مكتبة المتسولين" }] }),
  component: () => (
    <PolicyPage arField="shipping_policy_ar" enField="shipping_policy_en" titleAr="الشحن والتوصيل" titleEn="Shipping & Delivery" />
  ),
});
