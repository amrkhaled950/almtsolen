import { formatPrice, type Locale } from "@/lib/i18n";

const statusAr: Record<string, string> = {
  pending: "قيد الانتظار", confirmed: "مؤكد", processing: "قيد المعالجة",
  shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي", refunded: "مسترجع",
};

export function printWaybill(order: any, items: any[], locale: Locale = "ar") {
  const isAr = locale === "ar";
  const addr: any = order.shipping_address || {};
  const customerName = order.guest_name || addr.full_name || "—";
  const phone = order.guest_phone || addr.phone || "—";
  const fullAddress = [addr.governorate, addr.city, addr.street, addr.building && `عمارة ${addr.building}`, addr.apartment && `شقة ${addr.apartment}`]
    .filter(Boolean).join("، ");
  const created = new Date(order.created_at).toLocaleString("ar-EG");

  const rows = items.map((it) => `
    <tr>
      <td>${escapeHtml(it.product_title_ar || it.product_title_en || "")}</td>
      <td class="num">${it.quantity}</td>
      <td class="num">${formatPrice(Number(it.unit_price), locale)}</td>
      <td class="num">${formatPrice(Number(it.line_total), locale)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>بوليصة شحن — ${escapeHtml(order.order_number)}</title>
<style>
  @page { size: A5; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: "Cairo", "Tajawal", "Segoe UI", Tahoma, sans-serif; color: #111; margin: 0; padding: 16px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { font-size: 20px; font-weight: 900; }
  .meta { text-align: left; font-size: 11px; color: #444; }
  .meta strong { display: block; font-size: 16px; color: #111; }
  h2 { font-size: 13px; margin: 14px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
  .box { border: 1px solid #ccc; border-radius: 6px; padding: 10px; font-size: 12px; line-height: 1.7; }
  .row { display: flex; justify-content: space-between; gap: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: right; }
  th { background: #f3f4f6; font-weight: 700; }
  .num { text-align: center; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 10px; font-size: 12px; }
  .totals .line { display: flex; justify-content: space-between; padding: 3px 0; }
  .totals .total { font-weight: 900; font-size: 14px; border-top: 2px solid #111; padding-top: 6px; margin-top: 4px; }
  .notes { margin-top: 10px; padding: 8px; background: #fff7ed; border: 1px dashed #f59e0b; border-radius: 6px; font-size: 11px; }
  .footer { margin-top: 14px; font-size: 10px; color: #666; text-align: center; border-top: 1px dashed #ccc; padding-top: 8px; }
  .pay { display: inline-block; padding: 4px 8px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; font-weight: 700; font-size: 12px; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:10px;">
    <button onclick="window.print()" style="padding:8px 20px;font-size:14px;cursor:pointer;background:#111;color:#fff;border:0;border-radius:6px;font-weight:700;">🖨️ طباعة</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">📚 بوليصة شحن</div>
      <div style="font-size:11px;color:#666;margin-top:4px;">${escapeHtml(created)}</div>
    </div>
    <div class="meta">
      <span style="font-size:10px;">رقم الطلب</span>
      <strong>${escapeHtml(order.order_number)}</strong>
      <span class="pay">${escapeHtml(order.payment_method === "cod" ? "💰 دفع عند الاستلام" : "مدفوع")}</span>
    </div>
  </div>

  <h2>📍 بيانات المستلم</h2>
  <div class="box">
    <div class="row"><strong>${escapeHtml(customerName)}</strong><span>📞 ${escapeHtml(phone)}</span></div>
    <div>${escapeHtml(fullAddress || "—")}</div>
    ${addr.email ? `<div style="color:#555;font-size:11px;">✉️ ${escapeHtml(addr.email)}</div>` : ""}
  </div>

  <h2>📦 المنتجات</h2>
  <table>
    <thead><tr><th>المنتج</th><th class="num">الكمية</th><th class="num">السعر</th><th class="num">الإجمالي</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="line"><span>المجموع الفرعي</span><span>${formatPrice(Number(order.subtotal), locale)}</span></div>
    <div class="line"><span>الشحن</span><span>${Number(order.shipping_cost) === 0 ? "مجاناً" : formatPrice(Number(order.shipping_cost), locale)}</span></div>
    ${Number(order.discount) > 0 ? `<div class="line"><span>خصم</span><span>-${formatPrice(Number(order.discount), locale)}</span></div>` : ""}
    <div class="line total"><span>الإجمالي المستحق</span><span>${formatPrice(Number(order.total), locale)}</span></div>
  </div>

  ${order.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${escapeHtml(order.notes)}</div>` : ""}

  <div class="footer">
    الحالة: ${escapeHtml(statusAr[order.status] || order.status)} • شكراً لتعاملكم معنا
  </div>

  <script>
    setTimeout(() => { try { window.print(); } catch(e) {} }, 400);
  </script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) { alert("الرجاء السماح بفتح النوافذ المنبثقة"); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
