import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/layout/PolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | مكتبة روبن هود" },
      { name: "description", content: "تعرف على كيفية حماية بياناتك الشخصية وخصوصيتك عند استخدام موقع مكتبة روبن هود." },
      { property: "og:title", content: "سياسة الخصوصية | مكتبة روبن هود" },
      { property: "og:description", content: "كيف نتعامل مع بياناتك ونحميها." },
      { property: "og:url", content: "https://www.almotasolen.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/privacy" }],
  }),
  component: () => (
    <PolicyPage arField="privacy_policy_ar" enField="privacy_policy_en" titleAr="سياسة الخصوصية" titleEn="Privacy Policy" />
  ),
});
