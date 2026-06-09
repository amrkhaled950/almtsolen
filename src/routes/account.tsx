import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, User, Mail, Phone, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth, ensureAuthInit } from "@/lib/auth-store";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "حسابي | المتسولين" }] }),
  component: AccountPage,
});

function AccountPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  ensureAuthInit();
  const { user, isAdmin, loading, initialized, signOut } = useAuth();
  const navigate = useNavigate();

  if (!initialized || loading) {
    return (
      <div className="container-page py-20 grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" search={{ redirect: "/account" }} replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const fullName = (user.user_metadata?.full_name as string) || "";
  const phone = (user.user_metadata?.phone as string) || "";

  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="font-display font-black text-3xl mb-6">{isAr ? "حسابي" : "My account"}</h1>

      <div className="bg-card border border-border rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-display font-black text-2xl">
            {(fullName[0] || user.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-lg truncate">{fullName || (isAr ? "مستخدم" : "User")}</div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            {isAdmin && (
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <ShieldCheck className="h-3 w-3" /> Admin
              </div>
            )}
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <Row icon={User} label={isAr ? "الاسم" : "Name"} value={fullName || "—"} />
          <Row icon={Mail} label={isAr ? "البريد" : "Email"} value={user.email || "—"} />
          <Row icon={Phone} label={isAr ? "الهاتف" : "Phone"} value={phone || "—"} />
        </dl>
      </div>

      {isAdmin && (
        <Link to="/admin" className="block bg-primary text-primary-foreground rounded-xl p-4 text-center font-semibold mb-4 hover:bg-primary-hover">
          {isAr ? "الذهاب إلى لوحة التحكم" : "Go to admin dashboard"}
        </Link>
      )}

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        <LogOut className="h-4 w-4" />
        {isAr ? "تسجيل الخروج" : "Sign out"}
      </button>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground w-20 text-xs uppercase tracking-wider">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
