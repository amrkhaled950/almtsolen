import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tags, Settings, BookOpen, LogOut, BarChart3, UserCog, Ticket,
} from "lucide-react";
import { useLocale } from "../../lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { cn } from "../../lib/utils";

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      title: { ar: "نظرة عامة", en: "Overview" },
      items: [
        { to: "/admin", icon: LayoutDashboard, label: { ar: "لوحة التحكم", en: "Dashboard" }, exact: true },
        { to: "/admin/analytics", icon: BarChart3, label: { ar: "التحليلات", en: "Analytics" } },
      ],
    },
    {
      title: { ar: "المتجر", en: "Store" },
      items: [
        { to: "/admin/orders", icon: ShoppingBag, label: { ar: "الطلبات", en: "Orders" } },
        { to: "/admin/products", icon: Package, label: { ar: "المنتجات", en: "Products" } },
        { to: "/admin/categories", icon: Tags, label: { ar: "التصنيفات", en: "Categories" } },
        { to: "/admin/coupons", icon: Ticket, label: { ar: "الكوبونات", en: "Coupons" } },
        { to: "/admin/customers", icon: Users, label: { ar: "العملاء", en: "Customers" } },
      ],
    },
    {
      title: { ar: "النظام", en: "System" },
      items: [
        { to: "/admin/users", icon: UserCog, label: { ar: "المستخدمون والصلاحيات", en: "Users & roles" } },
        { to: "/admin/settings", icon: Settings, label: { ar: "الإعدادات", en: "Settings" } },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/admin-login", replace: true });
  };

  return (
    <aside className="flex h-full w-64 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-hero text-primary-foreground font-display font-black">م</div>
        <div>
          <div className="font-display font-extrabold text-sm leading-tight">{isAr ? "المتسولين" : "Al-Mutasawilein"}</div>
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase">{isAr ? "لوحة التحكم" : "Admin Panel"}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title.en}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? sec.title.ar : sec.title.en}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((it) => (
                <Link
                  key={it.to} to={it.to} onClick={onNavigate}
                  activeOptions={{ exact: it.exact }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground !text-sidebar-accent-foreground font-semibold" }}
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span>{isAr ? it.label.ar : it.label.en}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <BookOpen className="h-4 w-4" />
          {isAr ? "عرض المتجر" : "View store"}
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <LogOut className="h-4 w-4" />
          {isAr ? "تسجيل الخروج" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
