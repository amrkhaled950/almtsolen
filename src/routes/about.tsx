import { createFileRoute } from "@tanstack/react-router";
import { useLocale } from "../lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "من نحن | المتسولين" }] }),
  component: () => {
    const locale = useLocale((s) => s.locale);
    return (
      <div className="container-page py-16 max-w-3xl">
        <h1 className="font-display font-black text-4xl mb-6">
          {locale === "ar" ? "من نحن" : "About us"}
        </h1>
        <div className="prose prose-lg text-foreground/80 leading-relaxed space-y-4">
          <p>
            {locale === "ar"
              ? "المتسولين للكتب — متجر متخصص في الكتب العربية والعالمية، نهدف إلى نشر المعرفة وإيصال الكتاب لكل قارئ في مصر بأسعار مناسبة وخدمة متميزة."
              : "Al-Mutasawilein Books — a bookstore dedicated to making knowledge accessible across Egypt."}
          </p>
        </div>
      </div>
    );
  },
});
