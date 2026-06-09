import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useLocale } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "دخول المسؤولين | المتسولين" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const navigate = useNavigate();
  const { user, isAdmin, initialized, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialized || loading) return;
    if (user && isAdmin) navigate({ to: "/admin", replace: true });
  }, [user, isAdmin, initialized, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Sign-in failed");

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        await supabase.auth.signOut();
        throw new Error(isAr ? "هذا الحساب ليس له صلاحية مسؤول" : "This account is not an admin");
      }

      toast.success(isAr ? "أهلاً بك في لوحة التحكم" : "Welcome to the dashboard");
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-elegant border border-border p-8">
        <div className="flex flex-col items-center mb-7">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display font-black text-2xl">
            {isAr ? "لوحة تحكم المتسولين" : "Al-Mutasawilein Admin"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {isAr ? "هذه الصفحة مخصصة للمسؤولين فقط" : "Authorized personnel only"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{isAr ? "البريد الإلكتروني" : "Email"}</label>
            <input
              required type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full h-11 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{isAr ? "كلمة المرور" : "Password"}</label>
            <div className="relative">
              <input
                required type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-11 px-3 pe-10 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowPwd((s) => !s)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={busy}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover shadow-elegant disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAr ? "دخول لوحة التحكم" : "Sign in to dashboard"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {isAr ? "لإنشاء حساب مسؤول جديد، اطلب من أحد المسؤولين الحاليين إضافتك من قسم المستخدمين." : "Contact an existing admin to add your account."}
        </p>
      </div>
    </div>
  );
}
