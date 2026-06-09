import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://www.almotasolen.com";

const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/",           changefreq: "daily",   priority: "1.0" },
  { path: "/shop",       changefreq: "daily",   priority: "0.9" },
  { path: "/categories", changefreq: "weekly",  priority: "0.8" },
  { path: "/about",      changefreq: "monthly", priority: "0.5" },
  { path: "/contact",    changefreq: "monthly", priority: "0.5" },
  { path: "/shipping",   changefreq: "monthly", priority: "0.4" },
  { path: "/returns",    changefreq: "monthly", priority: "0.4" },
  { path: "/privacy",    changefreq: "yearly",  priority: "0.3" },
  { path: "/terms",      changefreq: "yearly",  priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }> =
          STATIC_ROUTES.map((r) => ({
            loc: `${BASE_URL}${r.path}`,
            changefreq: r.changefreq,
            priority: r.priority,
          }));

        // Dynamic entries: products + categories
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const [{ data: products }, { data: categories }] = await Promise.all([
            supabaseAdmin
              .from("products")
              .select("slug, updated_at")
              .eq("is_active", true)
              .limit(5000),
            supabaseAdmin
              .from("categories")
              .select("slug, updated_at")
              .eq("is_active", true)
              .limit(500),
          ]);

          (products ?? []).forEach((p: any) => {
            if (!p.slug) return;
            entries.push({
              loc: `${BASE_URL}/product/${encodeURIComponent(p.slug)}`,
              lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.7",
            });
          });

          (categories ?? []).forEach((c: any) => {
            if (!c.slug) return;
            entries.push({
              loc: `${BASE_URL}/shop?category=${encodeURIComponent(c.slug)}`,
              lastmod: c.updated_at ? new Date(c.updated_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.6",
            });
          });
        } catch (e) {
          // sitemap should still serve even if DB is unreachable
          console.error("sitemap: failed to load dynamic entries", e);
        }

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${escapeXml(e.loc)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
