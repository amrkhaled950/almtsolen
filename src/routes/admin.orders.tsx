import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Eye, Loader2, Download, Printer } from "lucide-react";
import {
  listOrdersAdmin,
  getOrderAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
  exportOrdersCsvAdmin,
} from "@/lib/orders.functions";
import { useLocale, formatPrice } from "@/lib/i18n";
import { printWaybill } from "@/lib/print-waybill";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

type OrderStatus =
  | "pending" | "confirmed" | "processing"
  | "shipped" | "delivered" | "cancelled" | "refunded";

const orderStatusLabel: Record<OrderStatus, { ar: string; en: string; color: string }> = {
  pending:    { ar: "قيد الانتظار",  en: "Pending",    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  confirmed:  { ar: "مؤكد",          en: "Confirmed",  color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
  processing: { ar: "قيد المعالجة", en: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  shipped:    { ar: "تم الشحن",      en: "Shipped",    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  delivered:  { ar: "تم التسليم",   en: "Delivered",  color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  cancelled:  { ar: "ملغي",          en: "Cancelled",  color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  refunded:   { ar: "مسترجع",        en: "Refunded",   color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
};

const paymentMethodLabel: Record<string, { ar: string; en: string }> = {
  cod:            { ar: "الدفع عند الاستلام", en: "Cash on delivery" },
  paymob_card:    { ar: "بطاقة (Paymob)",      en: "Card (Paymob)" },
  paymob_wallet:  { ar: "محفظة (Paymob)",      en: "Wallet (Paymob)" },
};

function OrdersPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const qc = useQueryClient();

  const fetchOrders = useServerFn(listOrdersAdmin);
  const fetchOrder  = useServerFn(getOrderAdmin);
  const updateStatus = useServerFn(updateOrderStatusAdmin);
  const deleteFn    = useServerFn(deleteOrderAdmin);
  const exportCsvFn = useServerFn(exportOrdersCsvAdmin);

  const exportMut = useMutation({
    mutationFn: (vars: { status?: OrderStatus }) =>
      exportCsvFn({ data: vars.status ? { status: vars.status } : {} }),
    onSuccess: (res: any) => {
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isAr ? `تم تصدير ${res.count} طلب` : `Exported ${res.count} orders`);
    },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  const ordersQ = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => fetchOrders(),
  });

  const orders: any[] = ordersQ.data?.orders ?? [];

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailStatus, setDetailStatus] = useState<OrderStatus>("pending");

  const filtered = orders.filter((o) => {
    const addr: any = o.shipping_address || {};
    const name = o.guest_name || addr.full_name || "";
    const phone = o.guest_phone || addr.phone || "";
    const matchQ = q
      ? (o.order_number || "").includes(q) || name.includes(q) || phone.includes(q)
      : true;
    const matchS = statusFilter === "all" ? true : o.status === statusFilter;
    return matchQ && matchS;
  });

  const detailQ = useQuery({
    queryKey: ["admin", "order", selectedId],
    queryFn: () => fetchOrder({ data: { id: selectedId! } }),
    enabled: !!selectedId,
  });

  const detail = detailQ.data;

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; status: OrderStatus }) =>
      updateStatus({ data: vars }),
    onSuccess: () => {
      toast.success(isAr ? "تم التحديث" : "Updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "order", selectedId] });
    },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(isAr ? "تم الحذف" : "Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      setSelectedId(null);
    },
    onError: (e: any) => toast.error(e?.message || "Error"),
  });

  const openDetail = (o: any) => {
    setSelectedId(o.id);
    setDetailStatus(o.status);
  };

  const allStatuses: ("all" | OrderStatus)[] = [
    "all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded",
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl">
            {isAr ? "الطلبات" : "Orders"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ordersQ.isLoading
              ? (isAr ? "جاري التحميل..." : "Loading...")
              : isAr ? `${orders.length} طلب إجمالاً` : `${orders.length} total orders`}
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {allStatuses.map((s) => {
          const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
          const label =
            s === "all"
              ? (isAr ? "الكل" : "All")
              : isAr ? orderStatusLabel[s].ar : orderStatusLabel[s].en;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-9 px-3.5 rounded-full text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground/80 hover:bg-muted"
              }`}
            >
              {label} <span className="opacity-70 ms-1">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isAr ? "ابحث برقم الطلب أو العميل..." : "Search by order # or customer..."}
              className="w-full h-10 ps-10 pe-4 rounded-lg bg-muted text-sm focus:outline-none focus:bg-background border border-transparent focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطلب" : "Order"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "التاريخ" : "Date"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "العميل" : "Customer"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "الدفع" : "Payment"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                <th className="text-end px-5 py-3 font-semibold">{isAr ? "الإجمالي" : "Total"}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {ordersQ.isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              )}
              {!ordersQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    {isAr ? "لا توجد طلبات" : "No orders"}
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const s = orderStatusLabel[o.status as OrderStatus] ?? orderStatusLabel.pending;
                const addr: any = o.shipping_address || {};
                const name = o.guest_name || addr.full_name || "—";
                const city = addr.city || addr.governorate || "—";
                const pm = paymentMethodLabel[o.payment_method];
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 font-bold">{o.order_number}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                        day: "numeric", month: "short",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{city}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {pm ? (isAr ? pm.ar : pm.en) : o.payment_method}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
                        {isAr ? s.ar : s.en}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-end font-bold">{formatPrice(Number(o.total), locale)}</td>
                    <td className="px-5 py-3 text-end">
                      <button
                        onClick={() => openDetail(o)}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <div className="absolute inset-y-0 end-0 w-full max-w-md bg-background shadow-2xl flex flex-col">
            {detailQ.isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : detail ? (
              <>
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="font-display font-black text-xl">{detail.order.order_number}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(detail.order.created_at).toLocaleString(isAr ? "ar-EG" : "en-US")}
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-muted rounded-md">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Customer */}
                  <section>
                    <h3 className="font-bold mb-2">{isAr ? "العميل" : "Customer"}</h3>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                      {(() => {
                        const addr: any = detail.order.shipping_address || {};
                        return (
                          <>
                            <div className="font-semibold">{detail.order.guest_name || addr.full_name || "—"}</div>
                            <div className="text-muted-foreground">{detail.order.guest_phone || addr.phone || "—"}</div>
                            <div className="text-muted-foreground">{detail.order.guest_email || addr.email || "—"}</div>
                            <div className="text-muted-foreground">{addr.governorate} {addr.city} {addr.street}</div>
                          </>
                        );
                      })()}
                    </div>
                  </section>

                  {/* Items */}
                  <section>
                    <h3 className="font-bold mb-2">{isAr ? "المنتجات" : "Items"}</h3>
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {detail.items.map((it: any) => (
                        <div key={it.id} className="p-3 flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">{isAr ? it.product_title_ar : it.product_title_en}</div>
                            <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                          </div>
                          <div className="font-bold">{formatPrice(Number(it.line_total), locale)}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Totals */}
                  <section className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                      <span>{formatPrice(Number(detail.order.subtotal), locale)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isAr ? "الشحن" : "Shipping"}</span>
                      <span>
                        {Number(detail.order.shipping_cost) === 0
                          ? (isAr ? "مجاناً" : "Free")
                          : formatPrice(Number(detail.order.shipping_cost), locale)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                      <span>{isAr ? "الإجمالي" : "Total"}</span>
                      <span className="text-primary">{formatPrice(Number(detail.order.total), locale)}</span>
                    </div>
                  </section>

                  {/* Update Status */}
                  <section className="flex gap-2">
                    <select
                      value={detailStatus}
                      onChange={(e) => setDetailStatus(e.target.value as OrderStatus)}
                      className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm"
                    >
                      {(Object.keys(orderStatusLabel) as OrderStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {isAr ? orderStatusLabel[s].ar : orderStatusLabel[s].en}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateMut.mutate({ id: selectedId, status: detailStatus })}
                      disabled={updateMut.isPending}
                      className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover flex items-center gap-2 disabled:opacity-60"
                    >
                      {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isAr ? "تحديث" : "Update"}
                    </button>
                  </section>

                  {/* Delete */}
                  <section className="pt-2 border-t border-border">
                    <button
                      onClick={() => {
                        if (confirm(isAr ? "حذف الطلب نهائياً؟" : "Delete this order permanently?")) {
                          deleteMut.mutate(selectedId);
                        }
                      }}
                      disabled={deleteMut.isPending}
                      className="w-full h-10 rounded-lg border border-rose-300 text-rose-600 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isAr ? "حذف الطلب" : "Delete order"}
                    </button>
                  </section>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
