import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useLocale } from "@/lib/i18n";
import { toast } from "sonner";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول وإنشاء حساب | مكتبة المتسولين" },
      { name: "description", content: "سجّل دخول حسابك في مكتبة المتسولين أو أنشئ حساباً جديداً لمتابعة طلباتك وحفظ كتبك المفضلة بسهولة." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "تسجيل الدخول | مكتبة المتسولين" },
      { property: "og:description", content: "ادخل إلى حسابك أو أنشئ حساباً جديداً في مكتبة المتسولين." },
      { property: "og:url", content: "https://www.almotasolen.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://www.almotasolen.com/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, initialized } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialized || !user) return;
    const target = search.redirect && !search.redirect.startsWith("/admin") ? search.redirect : "/account";
    navigate({ to: target, replace: true });
  }, [user, initialized, search.redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const schema = z.object({
          email: z.string().trim().email(),
          password: z.string().min(8).max(72),
          fullName: z.string().trim().min(2).max(80),
          phone: z.string().trim().min(6).max(20).optional().or(z.literal("")),
        });
        const parsed = schema.parse({ email, password, fullName, phone });
        // Auto-confirm via server fn so the user never has to verify email
        const { customerSignUp } = await import("@/lib/customer-auth.functions");
        await customerSignUp({
          data: {
            email: parsed.email,
            password: parsed.password,
            fullName: parsed.fullName,
            phone: parsed.phone || "",
          },
        });
        // Then sign them in immediately
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: parsed.email,
          password: parsed.password,
        });
        if (signInErr) throw signInErr;
        toast.success(isAr ? "تم إنشاء الحساب بنجاح!" : "Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success(isAr ? "أهلاً بعودتك!" : "Welcome back!");
      }
    } catch (err: any) {
      const msg = err?.message || (isAr ? "حدث خطأ" : "Something went wrong");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur font-display font-black text-2xl">م</div>
          <div>
            <div className="font-display font-extrabold text-lg">المتسولين</div>
            <div className="text-xs opacity-80 tracking-widest uppercase">للكتب</div>
          </div>
        </Link>
        <div>
          <BookOpen className="h-12 w-12 mb-4 opacity-80" />
          <h2 className="font-display font-black text-4xl leading-tight mb-3">
            {isAr ? "اقرأ. تعلّم. انطلق." : "Read. Learn. Grow."}
          </h2>
          <p className="opacity-90 max-w-md">
            {isAr
              ? "سجّل لمتابعة طلباتك والاحتفاظ بقائمة أمنياتك."
              : "Sign in to track your orders and save your wishlist."}
          </p>
        </div>
        <div className="text-xs opacity-70">© {new Date().getFullYear()} المتسولين</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero text-primary-foreground font-display font-black">م</div>
            <div className="font-display font-extrabold text-lg">المتسولين</div>
          </div>

          <h1 className="font-display font-black text-3xl mb-2">
            {mode === "signin"
              ? isAr ? "تسجيل الدخول" : "Sign in"
              : isAr ? "إنشاء حساب جديد" : "Create account"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {mode === "signin"
              ? isAr ? "أهلاً بعودتك! ادخل بياناتك للمتابعة" : "Welcome back! Enter your details"
              : isAr ? "انضم لمجتمع المتسولين في دقيقة" : "Join our community in a minute"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{isAr ? "الاسم الكامل" : "Full name"}</label>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
                    placeholder={isAr ? "محمد أحمد" : "John Doe"} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{isAr ? "الهاتف (اختياري)" : "Phone (optional)"}</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
                    placeholder="01012345678" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">{isAr ? "البريد الإلكتروني" : "Email"}</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
                placeholder="you@example.com" autoComplete="email" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{isAr ? "كلمة المرور" : "Password"}</label>
              <div className="relative">
                <input required type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} minLength={8}
                  className="w-full h-11 px-3 pe-10 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
                  placeholder={isAr ? "8 أحرف على الأقل" : "At least 8 characters"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Hide" : "Show"}>
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover transition-colors shadow-elegant disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin"
                ? isAr ? "دخول" : "Sign in"
                : isAr ? "إنشاء الحساب" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "signin"
              ? isAr ? "ليس لديك حساب؟" : "No account yet?"
              : isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-semibold hover:underline">
              {mode === "signin"
                ? isAr ? "أنشئ حساب جديد" : "Sign up"
                : isAr ? "سجّل الدخول" : "Sign in"}
            </button>
          </p>

          <Link to="/" className="block text-center mt-4 text-xs text-muted-foreground hover:text-primary">
            {isAr ? "← العودة للمتجر" : "← Back to store"}
          </Link>
        </div>
      </div>
    </div>
  );
}
