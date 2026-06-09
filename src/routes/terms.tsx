import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "الشروط والأحكام | مكتبة المتسولين" }] }),
  component: () => (
    <PolicyPage arField="terms_ar" enField="terms_en" titleAr="الشروط والأحكام" titleEn="Terms & Conditions" />
  ),
});
