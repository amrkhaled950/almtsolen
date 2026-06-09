import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "سياسة الخصوصية | مكتبة المتسولين" }] }),
  component: () => (
    <PolicyPage arField="privacy_policy_ar" enField="privacy_policy_en" titleAr="سياسة الخصوصية" titleEn="Privacy Policy" />
  ),
});
