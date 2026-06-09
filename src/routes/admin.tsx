import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { AdminTopbar } from "../components/admin/AdminTopbar";
import { useAuth, ensureAuthInit } from "@/lib/auth-store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم | المتسولين" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  ensureAuthInit();
  const { user, isAdmin, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
            <ShieldOff className="h-8 w-8" />
          </div>
          <h1 className="font-display font-black text-2xl mb-2">لا تملك صلاحية الوصول</h1>
          <p className="text-muted-foreground mb-6">
            هذه الصفحة مخصصة للمسؤولين فقط. سجّل الدخول بحساب أدمن للوصول.
          </p>
          <button
            onClick={() => useAuth.getState().signOut().then(() => (window.location.href = "/admin-login"))}
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover"
          >
            تسجيل خروج ودخول كأدمن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <div className="hidden lg:block fixed inset-y-0 start-0 z-30">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 start-0">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 lg:ms-64 flex flex-col min-w-0">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
