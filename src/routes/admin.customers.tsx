import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Mail, Phone } from "lucide-react";
import { customers } from "../lib/admin-data";
import { useLocale, formatPrice } from "../lib/i18n";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => customers.filter((c) => (q ? c.name.includes(q) || c.email.includes(q.toLowerCase()) || c.phone.includes(q) : true)),
    [q],
  );

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl">{isAr ? "العملاء" : "Customers"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? `${customers.length} عميل مسجل` : `${customers.length} registered customers`}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card-soft overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم، البريد أو الهاتف..." : "Search by name, email, or phone..."}
              className="w-full h-10 ps-10 pe-4 rounded-lg bg-muted text-sm focus:outline-none focus:bg-background border border-transparent focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "العميل" : "Customer"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "الاتصال" : "Contact"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "المدينة" : "City"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "الطلبات" : "Orders"}</th>
                <th className="text-end px-5 py-3 font-semibold">{isAr ? "إجمالي الإنفاق" : "Total spent"}</th>
                <th className="text-start px-5 py-3 font-semibold">{isAr ? "انضم" : "Joined"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div className="font-semibold">{c.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {c.email}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5"><Phone className="h-3 w-3" /> {c.phone}</div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-5 py-3 font-semibold">{c.orders}</td>
                  <td className="px-5 py-3 text-end font-bold text-primary">{formatPrice(c.totalSpent, locale)}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(c.joinedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
