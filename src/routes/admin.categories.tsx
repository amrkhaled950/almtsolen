import { createFileRoute } from "@tanstack/react-router";
import { Plus, Edit, Trash2, X, Check, Loader2, GripVertical, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listCategoriesAdmin, upsertCategoryAdmin, deleteCategoryAdmin } from "@/lib/admin-catalog.functions";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

const EMOJIS = ["📖","🏛️","💭","🕌","🧸","🌱","🔬","🪶","🎨","🌍","💡","🎭","🏆","🎓","🧠","📚","✍️","🗺️","🔭","🎪","🧬","⚔️","🌙","🕯️","🦋","🌺"];

type Category = {
  id: string; slug: string; name_ar: string; name_en: string;
  image_url: string | null; display_order: number; is_active: boolean;
  parent_id: string | null; show_in_nav: boolean; nav_order: number; icon: string | null;
};

function CategoriesPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const qc = useQueryClient();

  const fetchCats = useServerFn(listCategoriesAdmin);
  const upsertFn  = useServerFn(upsertCategoryAdmin);
  const deleteFn  = useServerFn(deleteCategoryAdmin);

  const catsQ = useQuery({ queryKey: ["admin","categories"], queryFn: () => fetchCats() });
  const all: Category[] = (catsQ.data?.categories ?? []) as unknown as Category[];
  const roots = all.filter((c) => !c.parent_id).sort((a,b) => a.nav_order - b.nav_order);
  const childrenOf = (pid: string) => all.filter((c) => c.parent_id === pid).sort((a,b) => a.nav_order - b.nav_order);

  // Form state
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [parentId, setParentId]     = useState<string | null>(null);
  const [nameAr, setNameAr]         = useState("");
  const [nameEn, setNameEn]         = useState("");
  const [slug, setSlug]             = useState("");
  const [icon, setIcon]             = useState("📖");
  const [showInNav, setShowInNav]   = useState(true);
  const [navOrder, setNavOrder]     = useState(0);
  const [isActive, setIsActive]     = useState(true);

  const resetForm = () => {
    setNameAr(""); setNameEn(""); setSlug(""); setIcon("📖");
    setShowInNav(true); setNavOrder(0); setIsActive(true);
    setParentId(null); setEditTarget(null); setShowForm(false);
  };

  const openAdd = (pid: string | null = null) => {
    resetForm();
    setParentId(pid);
    setNavOrder(pid ? childrenOf(pid).length : roots.length);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditTarget(c); setParentId(c.parent_id);
    setNameAr(c.name_ar); setNameEn(c.name_en ?? "");
    setSlug(c.slug); setIcon(c.icon || "📖");
    setShowInNav(c.show_in_nav ?? true);
    setNavOrder(c.nav_order ?? 0);
    setIsActive(c.is_active);
    setShowForm(true);
  };

  const upsertMut = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => { toast.success(isAr ? "تم الحفظ" : "Saved"); qc.invalidateQueries({ queryKey: ["admin","categories"] }); resetForm(); },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success(isAr ? "تم الحذف" : "Deleted"); qc.invalidateQueries({ queryKey: ["admin","categories"] }); setDeleteId(null); },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  const moveOrder = async (c: Category, dir: -1 | 1) => {
    await upsertFn({ data: { ...c, nav_order: c.nav_order + dir, image_url: c.image_url || "", description_ar: "", description_en: "" } });
    qc.invalidateQueries({ queryKey: ["admin","categories"] });
  };

  const handleSave = () => {
    if (!nameAr.trim() || !slug.trim()) return;
    upsertMut.mutate({
      ...(editTarget?.id ? { id: editTarget.id } : {}),
      slug: slug.trim().toLowerCase().replace(/\s+/g,"-"),
      name_ar: nameAr.trim(),
      name_en: nameEn.trim() || nameAr.trim(),
      image_url: icon,
      icon: icon,
      display_order: navOrder,
      nav_order: navOrder,
      show_in_nav: showInNav,
      is_active: isActive,
      parent_id: parentId || undefined,
    });
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl">{isAr ? "التصنيفات" : "Categories"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {catsQ.isLoading ? "..." : isAr ? `${roots.length} تصنيف رئيسي، ${all.length - roots.length} فرعي` : `${roots.length} main, ${all.length - roots.length} sub`}
          </p>
        </div>
        <button onClick={() => openAdd(null)}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          {isAr ? "تصنيف رئيسي جديد" : "New main category"}
        </button>
      </div>

      {catsQ.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      {!catsQ.isLoading && roots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border text-center">
          <div className="text-5xl mb-4">📂</div>
          <p className="font-bold text-lg">{isAr ? "لا يوجد تصنيفات بعد" : "No categories yet"}</p>
          <button onClick={() => openAdd(null)} className="mt-4 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            {isAr ? "أضف أول تصنيف" : "Add first category"}
          </button>
        </div>
      )}

      {/* Category tree */}
      <div className="space-y-3">
        {roots.map((cat, ri) => (
          <div key={cat.id} className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
            {/* Root category row */}
            <div className="flex items-center gap-3 p-4">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
              <span className="text-2xl shrink-0">{cat.icon || cat.image_url || "📖"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{isAr ? cat.name_ar : cat.name_en}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>/{cat.slug}</span>
                  {cat.show_in_nav && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] font-semibold">{isAr ? "في الهيدر" : "In nav"}</span>}
                  {!cat.is_active && <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">{isAr ? "مخفي" : "Hidden"}</span>}
                  <span className="text-muted-foreground">#{cat.nav_order}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveOrder(cat, -1)} disabled={ri === 0} className="grid h-7 w-7 place-items-center rounded hover:bg-muted disabled:opacity-30 text-xs">↑</button>
                <button onClick={() => moveOrder(cat, 1)} disabled={ri === roots.length - 1} className="grid h-7 w-7 place-items-center rounded hover:bg-muted disabled:opacity-30 text-xs">↓</button>
                <button onClick={() => openAdd(cat.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-primary/10 hover:text-primary" title={isAr ? "إضافة تصنيف فرعي" : "Add sub-category"}>
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(cat)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteId(cat.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sub-categories */}
            {childrenOf(cat.id).length > 0 && (
              <div className="border-t border-border bg-muted/20">
                {childrenOf(cat.id).map((sub, si) => (
                  <div key={sub.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ms-6" />
                    <span className="text-lg shrink-0">{sub.icon || sub.image_url || "📖"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{isAr ? sub.name_ar : sub.name_en}</div>
                      <div className="text-xs text-muted-foreground">/{sub.slug}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveOrder(sub, -1)} disabled={si === 0} className="grid h-6 w-6 place-items-center rounded hover:bg-muted disabled:opacity-30 text-xs">↑</button>
                      <button onClick={() => moveOrder(sub, 1)} disabled={si === childrenOf(cat.id).length - 1} className="grid h-6 w-6 place-items-center rounded hover:bg-muted disabled:opacity-30 text-xs">↓</button>
                      <button onClick={() => openEdit(sub)} className="grid h-7 w-7 place-items-center rounded hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(sub.id)} className="grid h-7 w-7 place-items-center rounded hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add sub button */}
            <button onClick={() => openAdd(cat.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors border-t border-border/50">
              <Plus className="h-3.5 w-3.5" />
              {isAr ? `إضافة تصنيف فرعي لـ "${cat.name_ar}"` : `Add sub-category to "${cat.name_en}"`}
            </button>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-black text-xl">
                {editTarget
                  ? (isAr ? "تعديل التصنيف" : "Edit Category")
                  : parentId
                    ? (isAr ? "تصنيف فرعي جديد" : "New Sub-category")
                    : (isAr ? "تصنيف رئيسي جديد" : "New Main Category")}
              </h2>
              <button onClick={resetForm} className="p-1.5 hover:bg-muted rounded-md"><X className="h-5 w-5" /></button>
            </div>

            {/* Parent indicator */}
            {parentId && (
              <div className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                {isAr ? "تصنيف فرعي لـ: " : "Sub-category of: "}
                {all.find(c => c.id === parentId)?.[isAr ? "name_ar" : "name_en"]}
              </div>
            )}

            {/* Icon picker */}
            <div>
              <label className="text-sm font-semibold mb-2 block">{isAr ? "الأيقونة" : "Icon"}</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setIcon(e)}
                    className={`text-xl w-9 h-9 rounded-lg border-2 transition-colors ${icon === e ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">{isAr ? "الاسم بالعربية *" : "Name (Arabic) *"}</label>
              <input value={nameAr} onChange={(e) => { setNameAr(e.target.value); if (!editTarget) setSlug(e.target.value.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^\w-]/g,"")); }}
                placeholder="مثال: أدب وروايات"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary" dir="rtl" />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Literature"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary" />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Slug *</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g,"-"))} placeholder="e.g. literature"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary" />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">{isAr ? "الترتيب في القائمة" : "Nav order"}</label>
              <input type="number" min={0} value={navOrder} onChange={(e) => setNavOrder(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium">{isAr ? "يظهر في الهيدر" : "Show in header nav"}</span>
              <button onClick={() => setShowInNav(!showInNav)}
                className={`relative h-6 w-11 rounded-full transition-colors ${showInNav ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 ${showInNav ? "end-0.5" : "start-0.5"} h-5 w-5 rounded-full bg-white shadow transition-all`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium">{isAr ? "نشط / مرئي" : "Active / Visible"}</span>
              <button onClick={() => setIsActive(!isActive)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 ${isActive ? "end-0.5" : "start-0.5"} h-5 w-5 rounded-full bg-white shadow transition-all`} />
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={resetForm} className="flex-1 h-10 rounded-lg border border-input text-sm font-semibold hover:bg-muted">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={handleSave} disabled={!nameAr.trim() || !slug.trim() || upsertMut.isPending}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5">
                {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isAr ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="text-4xl">🗑️</div>
            <h2 className="font-bold text-lg">{isAr ? "حذف التصنيف؟" : "Delete category?"}</h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? "سيتم حذف التصنيفات الفرعية بداخله أيضاً." : "Sub-categories will also be deleted."}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-10 rounded-lg border border-input text-sm font-semibold hover:bg-muted">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button onClick={() => deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}
                className="flex-1 h-10 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 flex items-center justify-center gap-2 disabled:opacity-60">
                {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAr ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
