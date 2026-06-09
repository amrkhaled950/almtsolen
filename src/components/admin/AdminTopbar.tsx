import { Bell, Search, Menu, Globe, Moon, Sun, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLocale } from "../../lib/i18n";
import { useAuth } from "@/lib/auth-store";

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { locale, setLocale } = useLocale();
  const isAr = locale === "ar";
  const [dark, setDark] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document === "undefined") return;
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/admin-login", replace: true });
  };

  const email = user?.email ?? "";
  const initial = (email[0] || "A").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-md px-4 md:px-6">
      <button onClick={onMenuClick} className="lg:hidden -ms-2 p-2 rounded-md hover:bg-muted" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder={isAr ? "ابحث في الطلبات، المنتجات، العملاء..." : "Search..."}
          className="w-full h-10 ps-10 pe-4 rounded-lg bg-muted text-sm border border-transparent focus:border-primary focus:bg-background focus:outline-none transition-colors"
        />
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="h-9 px-3 rounded-md hover:bg-muted text-sm font-medium flex items-center gap-1.5">
          <Globe className="h-4 w-4" />
          {isAr ? "EN" : "AR"}
        </button>
        <button onClick={toggleDark} className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="ms-2 flex items-center gap-2 ps-3 border-s border-border">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold text-sm">
            {initial}
          </div>
          <div className="hidden md:block max-w-[180px]">
            <div className="text-sm font-semibold leading-tight truncate">Admin</div>
            <div className="text-[11px] text-muted-foreground truncate">{email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="ms-1 grid h-9 w-9 place-items-center rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            aria-label="Sign out"
            title={isAr ? "تسجيل الخروج" : "Sign out"}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
