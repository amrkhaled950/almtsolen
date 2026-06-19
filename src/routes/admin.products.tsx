import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Upload, Loader2, X, Download } from "lucide-react";
import {
  listProductsAdmin,
  listCategoriesAdmin,
  upsertProductAdmin,
  deleteProductAdmin,
} from "@/lib/admin-catalog.functions";
import { importProductsJson } from "@/lib/products-import.functions";
import { useLocale, formatPrice } from "@/lib/i18n";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

type ProductRow = any;

function ProductsPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const qc = useQueryClient();

  const fetchProducts = useServerFn(listProductsAdmin);
  const fetchCats = useServerFn(listCategoriesAdmin);
  const upsertFn = useServerFn(upsertProductAdmin);
  const deleteFn = useServerFn(deleteProductAdmin);
  const importFn = useServerFn(importProductsJson);

  const productsQ = useQuery({ queryKey: ["admin", "products"], queryFn: () => fetchProducts() });
  const catsQ = useQuery({ queryKey: ["admin", "categories"], queryFn: () => fetchCats() });

  const products: ProductRow[] = productsQ.data?.products ?? [];
  const categories: any[] = catsQ.data?.categories ?? [];

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchQ = q
        ? (p.title_ar || "").includes(q) ||
          (p.title_en || "").toLowerCase().includes(q.toLowerCase()) ||
          (p.author_ar || "").includes(q)
        : true;
      const matchC = cat === "all" ? true : p.category_id === cat;
      return matchQ && matchC;
    });
  }, [products, q, cat]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((p) => next.delete(p.id));
      else filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(isAr ? "تم الحذف" : "Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(isAr ? `حذف ${ids.length} منتج؟ لا يمكن التراجع.` : `Delete ${ids.length} products? Cannot be undone.`)) return;
    setBulkDeleting(true);
    let ok = 0, fail = 0;
    const CONC = 8;
    for (let i = 0; i < ids.length; i += CONC) {
      const slice = ids.slice(i, i + CONC);
      const results = await Promise.allSettled(slice.map((id) => deleteFn({ data: { id } })));
      results.forEach((r) => (r.status === "fulfilled" ? ok++ : fail++));
    }
    setBulkDeleting(false);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    if (fail === 0) toast.success(isAr ? `تم حذف ${ok}` : `Deleted ${ok}`);
    else toast.error(isAr ? `تم ${ok}، فشل ${fail}` : `${ok} deleted, ${fail} failed`);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl">{isAr ? "المنتجات" : "Products"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {productsQ.isLoading ? (isAr ? "جاري التحميل..." : "Loading...") :
              isAr ? `${products.length} منتج` : `${products.length} products`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="h-10 px-4 rounded-lg border border-input bg-background text-sm font-semibold hover:bg-muted flex items-center gap-1.5"
          >
            <Upload className="h-4 w-4" />
            {isAr ? "استيراد JSON" : "Import JSON"}
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة منتج" : "Add product"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isAr ? "ابحث بالعنوان أو المؤلف..." : "Search..."}
              className="w-full h-10 ps-10 pe-4 rounded-lg bg-muted text-sm focus:outline-none focus:bg-background border border-transparent focus:border-primary"
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
          >
            <option value="all">{isAr ? "كل التصنيفات" : "All categories"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_en}</option>
            ))}
          </select>
          <div className="ms-auto text-xs text-muted-foreground">
            {isAr ? `${filtered.length} منتج` : `${filtered.length} products`}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="px-4 py-2 border-b border-border bg-primary/5 flex items-center gap-3 text-sm">
            <span className="font-semibold">
              {isAr ? `محدد: ${selected.size}` : `Selected: ${selected.size}`}
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              {isAr ? "إلغاء التحديد" : "Clear"}
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className="ms-auto h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {isAr ? "حذف المحدد" : "Delete selected"}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-input cursor-pointer"
                  />
                </th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "المنتج" : "Product"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "البيع" : "Price"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "التكلفة" : "Cost"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "تسويق" : "Mkt"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "نثرية" : "Misc"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "الربح" : "Profit"}</th>
                <th className="text-start px-4 py-3 font-semibold">{isAr ? "المخزون" : "Stock"}</th>
                <th className="text-end px-4 py-3 font-semibold">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={`border-t border-border hover:bg-muted/30 ${selected.has(p.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="h-4 w-4 rounded border-input cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.cover_url ? (
                        <img src={p.cover_url} alt="" className="h-12 w-9 rounded object-cover bg-muted shrink-0" />
                      ) : (
                        <div className="h-12 w-9 rounded bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[260px]">{isAr ? p.title_ar : p.title_en}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[260px]">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{formatPrice(Number(p.price), locale)}</td>
                  <td className="px-4 py-3">{formatPrice(Number(p.cost_price || 0), locale)}</td>
                  <td className="px-4 py-3">{formatPrice(Number(p.marketing_cost || 0), locale)}</td>
                  <td className="px-4 py-3">{formatPrice(Number(p.misc_expenses || 0), locale)}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{formatPrice(Number(p.profit_margin || 0), locale)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.stock > 0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(p); setShowForm(true); }}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(isAr ? `حذف "${p.title_ar}"؟` : `Delete "${p.title_en}"?`)) {
                            deleteMut.mutate(p.id);
                          }
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!productsQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-muted-foreground">
                    {isAr ? "لا توجد منتجات" : "No products"}
                  </td>
                </tr>
              )}
              {productsQ.isLoading && (
                <tr><td colSpan={9} className="text-center py-16"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ProductFormDialog
          product={editing}
          categories={categories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={async (payload) => {
            try {
              await upsertFn({ data: payload });
              toast.success(isAr ? "تم الحفظ" : "Saved");
              qc.invalidateQueries({ queryKey: ["admin", "products"] });
              setShowForm(false);
              setEditing(null);
            } catch (e: any) {
              toast.error(e?.message || "Error");
            }
          }}
        />
      )}

      {showImport && (
        <ImportJsonDialog
          categories={categories}
          onClose={() => setShowImport(false)}
          onImport={async (payload, default_category_id, upsert) => {
            try {
              const res: any = await importFn({ data: { payload, default_category_id, upsert } });
              toast.success(
                isAr
                  ? `تم استيراد ${res.processed} منتج، وربط ${res.categorized ?? 0} بالتصنيفات، وإنشاء ${res.categories_created ?? 0} تصنيف جديد (${res.skipped_invalid} متجاهل)`
                  : `Imported ${res.processed} products, linked ${res.categorized ?? 0} to categories, ${res.categories_created ?? 0} new categories (${res.skipped_invalid} skipped)`,
              );
              qc.invalidateQueries({ queryKey: ["admin", "products"] });
              qc.invalidateQueries({ queryKey: ["admin", "categories"] });
              setShowImport(false);
              return res;
            } catch (e: any) {
              toast.error(e?.message || "Import failed");
              throw e;
            }
          }}
        />
      )}
    </div>
  );
}

function ProductFormDialog({
  product, categories, onClose, onSave,
}: {
  product: any | null;
  categories: any[];
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: product?.id,
    slug: product?.slug || "",
    title_ar: product?.title_ar || "",
    title_en: product?.title_en || "",
    author_ar: product?.author_ar || "",
    author_en: product?.author_en || "",
    publisher_ar: product?.publisher_ar || "",
    publisher_en: product?.publisher_en || "",
    description_ar: product?.description_ar || "",
    description_en: product?.description_en || "",
    price: Number(product?.price || 0),
    compare_at_price: product?.compare_at_price != null ? Number(product.compare_at_price) : null,
    cost_price: Number(product?.cost_price || 0),
    marketing_cost: Number(product?.marketing_cost || 0),
    misc_expenses: Number(product?.misc_expenses || 0),
    cover_url: product?.cover_url || "",
    category_id: product?.category_id || null,
    pages: product?.pages || null,
    isbn: product?.isbn || "",
    stock: Number(product?.stock || 0),
    is_active: product?.is_active ?? true,
    is_bestseller: product?.is_bestseller ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
    is_featured: product?.is_featured ?? false,
  });
  const profit = form.price - form.cost_price - form.marketing_cost - form.misc_expenses;

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: string) => (e: any) => set(k, Number(e.target.value) || 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 end-0 w-full max-w-2xl bg-background shadow-2xl flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-black text-xl">
            {product ? (isAr ? "تعديل منتج" : "Edit product") : (isAr ? "إضافة منتج" : "Add product")}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md"><X className="h-5 w-5" /></button>
        </div>
        <form
          className="flex-1 overflow-y-auto p-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try { await onSave(form); } finally { setSaving(false); }
          }}
        >
          {product?.slug && (
            <Field label={isAr ? "الـ slug (يُولّد تلقائياً)" : "Slug (auto-generated)"}>
              <input className="input bg-muted/40" value={form.slug} readOnly />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={isAr ? "العنوان (عربي)" : "Title AR"} required><input className="input" value={form.title_ar} onChange={(e) => set("title_ar", e.target.value)} required /></Field>
            <Field label={isAr ? "العنوان (إنجليزي)" : "Title EN"} required><input className="input" value={form.title_en} onChange={(e) => set("title_en", e.target.value)} required /></Field>
            <Field label={isAr ? "المؤلف (عربي)" : "Author AR"} required><input className="input" value={form.author_ar} onChange={(e) => set("author_ar", e.target.value)} required /></Field>
            <Field label={isAr ? "المؤلف (إنجليزي)" : "Author EN"} required><input className="input" value={form.author_en} onChange={(e) => set("author_en", e.target.value)} required /></Field>
            <Field label={isAr ? "الناشر (عربي)" : "Publisher AR"}><input className="input" value={form.publisher_ar} onChange={(e) => set("publisher_ar", e.target.value)} /></Field>
            <Field label={isAr ? "الناشر (إنجليزي)" : "Publisher EN"}><input className="input" value={form.publisher_en} onChange={(e) => set("publisher_en", e.target.value)} /></Field>
          </div>
          <Field label={isAr ? "صورة الغلاف" : "Cover image"}>
            <ImageUpload value={form.cover_url} onChange={(v) => set("cover_url", v)} folder="products" size={120} />
          </Field>
          <Field label={isAr ? "التصنيف" : "Category"}>
            <select className="input" value={form.category_id || ""} onChange={(e) => set("category_id", e.target.value || null)}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_en}</option>
              ))}
            </select>
          </Field>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="font-display font-bold">{isAr ? "الأسعار" : "Pricing"}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label={isAr ? "سعر البيع" : "Selling price"} required><input type="number" step="0.01" min="0" className="input" value={form.price} onChange={num("price")} required /></Field>
              <Field label={isAr ? "سعر قبل الخصم" : "Compare-at"}><input type="number" step="0.01" min="0" className="input" value={form.compare_at_price ?? ""} onChange={(e) => set("compare_at_price", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label={isAr ? "سعر التكلفة" : "Cost price"}><input type="number" step="0.01" min="0" className="input" value={form.cost_price} onChange={num("cost_price")} /></Field>
              <Field label={isAr ? "تكلفة التسويق" : "Marketing cost"}><input type="number" step="0.01" min="0" className="input" value={form.marketing_cost} onChange={num("marketing_cost")} /></Field>
              <Field label={isAr ? "مصاريف نثرية" : "Misc expenses"}><input type="number" step="0.01" min="0" className="input" value={form.misc_expenses} onChange={num("misc_expenses")} /></Field>
              <Field label={isAr ? "هامش الربح (تلقائي)" : "Profit (auto)"}>
                <div className={`input flex items-center font-bold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {profit.toFixed(2)}
                </div>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={isAr ? "المخزون" : "Stock"} required><input type="number" min="0" className="input" value={form.stock} onChange={num("stock")} required /></Field>
            <Field label={isAr ? "عدد الصفحات" : "Pages"}><input type="number" min="0" className="input" value={form.pages ?? ""} onChange={(e) => set("pages", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="ISBN"><input className="input" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} /></Field>
          </div>

          <Field label={isAr ? "الوصف (عربي)" : "Description AR"}><textarea className="input min-h-[80px]" value={form.description_ar} onChange={(e) => set("description_ar", e.target.value)} /></Field>
          <Field label={isAr ? "الوصف (إنجليزي)" : "Description EN"}><textarea className="input min-h-[80px]" value={form.description_en} onChange={(e) => set("description_en", e.target.value)} /></Field>

          <div className="flex flex-wrap gap-4">
            <Checkbox checked={form.is_active} onChange={(v) => set("is_active", v)} label={isAr ? "نشط" : "Active"} />
            <Checkbox checked={form.is_bestseller} onChange={(v) => set("is_bestseller", v)} label={isAr ? "الأكثر مبيعاً" : "Best seller"} />
            <Checkbox checked={form.is_new_arrival} onChange={(v) => set("is_new_arrival", v)} label={isAr ? "وصل حديثاً" : "New arrival"} />
            <Checkbox checked={form.is_featured} onChange={(v) => set("is_featured", v)} label={isAr ? "مميز" : "Featured"} />
          </div>

          <div className="flex gap-2 pt-3 border-t border-border sticky bottom-0 bg-background -mx-5 -mb-5 px-5 py-4">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border border-input bg-background text-sm font-semibold hover:bg-muted">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" disabled={saving} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAr ? "حفظ" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportJsonDialog({
  categories, onClose, onImport,
}: {
  categories: any[];
  onClose: () => void;
  onImport: (payload: any, default_category_id: string | null, upsert: boolean) => Promise<any>;
}) {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [defaultCat, setDefaultCat] = useState<string>("");
  const [upsert, setUpsert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 end-0 w-full max-w-xl bg-background shadow-2xl flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-black text-xl">{isAr ? "استيراد منتجات من JSON" : "Import products from JSON"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">{isAr ? "تنسيقات مدعومة:" : "Supported shapes:"}</div>
            <div>• <code>[ {"{...}"}, {"{...}"} ]</code></div>
            <div>• <code>{"{ products: [...] }"}</code> / <code>{"{ data: [...] }"}</code> / <code>{"{ items: [...] }"}</code></div>
            <div className="pt-1">{isAr ? "حقول معروفة: title/name, price, image/images, sku, stock/quantity, description, author, publisher, category, cost_price, marketing_cost, misc_expenses." : "Recognized: title/name, price, image/images, sku, stock, description, author, publisher, category, cost_price, marketing_cost, misc_expenses."}</div>
            <div>{isAr ? "لو فيه حقل category باسم تصنيف مش موجود هيتعمل تلقائي. الحد الأقصى 20,000 منتج." : "If category name doesn't exist it will be created automatically. Max 20,000 products."}</div>
            <div>{isAr ? "EasyOrders/Shopify/WooCommerce بيشتغلوا تلقائي." : "EasyOrders/Shopify/Woo work automatically."}</div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1 text-sm"
            >
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-semibold">{filename || (isAr ? "اختر ملف JSON" : "Choose JSON file")}</span>
              {filename && <span className="text-xs text-muted-foreground">{isAr ? "اضغط لتغيير الملف" : "Click to change"}</span>}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 30 * 1024 * 1024) {
                  toast.error(isAr ? "الملف أكبر من 30 ميجا" : "File too large (>30MB)");
                  return;
                }
                setFilename(f.name);
                const t = await f.text();
                setText(t);
              }}
            />
          </div>

          <Field label={isAr ? "أو الصق JSON هنا" : "Or paste JSON"}>
            <textarea
              className="input min-h-[140px] font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='[{"title":"...","price":100,...}]'
            />
          </Field>

          <Field label={isAr ? "تصنيف افتراضي (اختياري)" : "Default category (optional)"}>
            <select className="input" value={defaultCat} onChange={(e) => setDefaultCat(e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_en}</option>
              ))}
            </select>
          </Field>

          <Checkbox
            checked={upsert}
            onChange={setUpsert}
            label={isAr ? "تحديث المنتجات الموجودة (مطابقة بالـ slug)" : "Update existing products (match by slug)"}
          />

          {result && (
            <div className="rounded-lg border border-border bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm space-y-1">
              <div className="font-bold text-emerald-700 dark:text-emerald-300">{isAr ? "تم!" : "Done!"}</div>
              <div>{isAr ? "إجمالي:" : "Total:"} {result.total}</div>
              <div>{isAr ? "تم استيراده:" : "Imported:"} {result.processed}</div>
              <div>{isAr ? "اتربط بتصنيف:" : "Categorized:"} {result.categorized ?? 0}</div>
              <div>{isAr ? "متجاهل:" : "Skipped:"} {result.skipped_invalid}</div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-border flex gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-lg border border-input bg-background text-sm font-semibold hover:bg-muted">
            {isAr ? "إغلاق" : "Close"}
          </button>
          <button
            disabled={loading || !text.trim()}
            onClick={async () => {
              setLoading(true);
              setResult(null);
              try {
                const r = await onImport(text, defaultCat || null, upsert);
                setResult(r);
              } catch { /* toast handled */ }
              finally { setLoading(false); }
            }}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Download className="h-4 w-4" />
            {isAr ? "ابدأ الاستيراد" : "Start import"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground/80 mb-1 block">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-input" />
      {label}
    </label>
  );
}
