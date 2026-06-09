// Generate a URL-safe slug. Prefers ASCII; falls back to a short random id.
export function slugify(input: string): string {
  const s = (input || "")
    .toString()
    .toLowerCase()
    .trim()
    // strip Arabic diacritics
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // separators → dash
    .replace(/[\s_/\\]+/g, "-")
    // keep only ASCII letters, digits, dash
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (s.length >= 2) return s;
  // Arabic-only or empty → random fallback
  return `item-${Math.random().toString(36).slice(2, 8)}`;
}

// Build a unique slug by checking existing rows.
export async function ensureUniqueSlug(
  client: any,
  table: "products" | "categories",
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    let q = client.from(table).select("id").eq("slug", candidate).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Math.random().toString(36).slice(2, 6)}`;
}
