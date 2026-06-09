import { Link } from "@tanstack/react-router";
import { useLocale } from "../../lib/i18n";
import { useSiteSettings } from "../../lib/use-site-settings";
import type { SiteSettings } from "../../lib/site-settings.functions";

type Props = {
  arField: keyof SiteSettings;
  enField: keyof SiteSettings;
  titleAr: string;
  titleEn: string;
};

export function PolicyPage({ arField, enField, titleAr, titleEn }: Props) {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const { settings, isLoading } = useSiteSettings();
  const content = (isAr ? (settings?.[arField] as string | null) : (settings?.[enField] as string | null)) ?? "";
  const title = isAr ? titleAr : titleEn;

  return (
    <div className="container-page py-12 max-w-3xl">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">{isAr ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span>{title}</span>
      </nav>
      <h1 className="font-display font-black text-3xl md:text-4xl mb-6">{title}</h1>
      {isLoading ? (
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      ) : content.trim() ? (
        <article className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90">
          {content}
        </article>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {isAr ? "لم يتم إضافة محتوى لهذه الصفحة بعد." : "No content has been added for this page yet."}
        </div>
      )}
    </div>
  );
}
