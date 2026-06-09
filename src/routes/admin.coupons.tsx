import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Edit, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  listCouponsAdmin,
  saveCouponAdmin,
  deleteCouponAdmin,
} from "../lib/coupons.functions";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "الكوبونات | لوحة التحكم" }, { name: "robots", content: "noindex" }] }),
  component: AdminCoupons,
});

type Coupon = {
  id?: string;
  code: string;
  description?: string | null;
  type: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  used_count?: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
};

const empty: Coupon = {
  code: "",
  description: "",
  type: "percent",
  value: 10,
  min_subtotal: 0,
  max_discount: null,
  usage_limit: null,
  starts_at: null,
  expires_at: null,
  is_active: true,
};

function AdminCoupons() {
  const listFn = useServerFn(listCouponsAdmin);
  const saveFn = useServerFn(saveCouponAdmin);
  const delFn = useServerFn(deleteCouponAdmin);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await saveFn({
        data: {
          ...editing,
          code: editing.code.trim().toUpperCase(),
          value: Number(editing.value),
          min_subtotal: Number(editing.min_subtotal) || 0,
          max_discount: editing.max_discount ? Number(editing.max_discount) : null,
          usage_limit: editing.usage_limit ? Number(editing.usage_limit) : null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditing(null);
      toast.success("تم الحفظ");
    } catch (e: any) {
      toast.error(e?.message || "خطأ");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الكوبون؟")) return;
    await delFn({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    toast.success("تم الحذف");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-2xl flex items-center gap-2">
          <Tag className="h-6 w-6" /> الكوبونات
        </h1>
        <button onClick={() => setEditing({ ...empty })}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> كوبون جديد
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-start p-3">الكود</th>
                <th className="text-start p-3">النوع</th>
                <th className="text-start p-3">القيمة</th>
                <th className="text-start p-3">حد أدنى</th>
                <th className="text-start p-3">الاستخدام</th>
                <th className="text-start p-3">الانتهاء</th>
                <th className="text-start p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(data?.coupons ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3">{c.type === "percent" ? "نسبة" : "ثابت"}</td>
                  <td className="p-3">{c.value}{c.type === "percent" ? "%" : " ج.م"}</td>
                  <td className="p-3">{c.min_subtotal} ج.م</td>
                  <td className="p-3">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                  <td className="p-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-EG") : "—"}</td>
                  <td className="p-3">
                    <span className={cn("text-xs px-2 py-1 rounded-full", c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      {c.is_active ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing(c)} className="h-8 w-8 grid place-items-center rounded hover:bg-muted">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(c.id)} className="h-8 w-8 grid place-items-center rounded hover:bg-destructive/10 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.coupons ?? []).length === 0 && (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">لا توجد كوبونات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => !busy && setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-bold text-xl mb-4">{editing.id ? "تعديل كوبون" : "كوبون جديد"}</h2>
            <div className="space-y-3">
              <FieldText label="الكود" value={editing.code} onChange={(v) => setEditing({ ...editing, code: v })} />
              <FieldText label="الوصف" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">النوع</label>
                  <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background">
                    <option value="percent">نسبة %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
                <FieldNum label="القيمة" value={editing.value} onChange={(v) => setEditing({ ...editing, value: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldNum label="الحد الأدنى للطلب" value={editing.min_subtotal} onChange={(v) => setEditing({ ...editing, min_subtotal: v })} />
                <FieldNum label="أقصى خصم (للنسبة)" value={editing.max_discount ?? 0} onChange={(v) => setEditing({ ...editing, max_discount: v || null })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldNum label="حد الاستخدام (فارغ = لا حد)" value={editing.usage_limit ?? 0} onChange={(v) => setEditing({ ...editing, usage_limit: v || null })} />
                <FieldDate label="تاريخ الانتهاء" value={editing.expires_at} onChange={(v) => setEditing({ ...editing, expires_at: v })} />
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <span>نشط</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={save} disabled={busy || !editing.code}
                className="flex-1 h-11 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
              </button>
              <button onClick={() => setEditing(null)} disabled={busy}
                className="h-11 px-5 rounded-md border border-border hover:bg-muted">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background" />
    </div>
  );
}
function FieldNum({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-10 px-3 rounded-md border border-input bg-background" />
    </div>
  );
}
function FieldDate({ label, value, onChange }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void }) {
  const v = value ? value.slice(0, 10) : "";
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type="date" value={v} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        className="w-full h-10 px-3 rounded-md border border-input bg-background" />
    </div>
  );
}
