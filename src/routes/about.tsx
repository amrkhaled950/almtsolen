import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "../lib/i18n";
import { useSiteSettings } from "../lib/use-site-settings";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "من نحن | المتسولين" }] }),
  component: () => {
    const locale = useLocale((s) => s.locale);
    const isAr = locale === "ar";
    const { settings, isLoading } = useSiteSettings();
    const content = (isAr ? settings?.about_ar : settings?.about_en) || "";
    const fallback = isAr
      ? "المتسولين للكتب — متجر متخصص في الكتب العربية والعالمية، نهدف إلى نشر المعرفة وإيصال الكتاب لكل قارئ في مصر بأسعار مناسبة وخدمة متميزة."
      : "Al-Mutasawilein Books — a bookstore dedicated to making knowledge accessible across Egypt.";
    return (
      <div className="container-page py-16 max-w-3xl">
        <h1 className="font-display font-black text-4xl mb-6">{isAr ? "من نحن" : "About us"}</h1>
        {isLoading ? (
          <div className="h-40 rounded-xl bg-muted animate-pulse" />
        ) : (
          <article className="prose prose-lg text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {content.trim() || fallback}
          </article>
        )}
      </div>
    );
  },
});
