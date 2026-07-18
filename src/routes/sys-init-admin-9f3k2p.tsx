import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createAdminWithSecret, promoteExistingUserToAdmin } from "@/lib/customer-auth.functions";
import { toast } from "sonner";

// Hidden, obscure path. NOT linked from any UI. Requires ADMIN_INIT_SECRET.
export const Route = createFileRoute("/sys-init-admin-9f3k2p")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "System" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InitAdminPage,
});

function InitAdminPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createAdminWithSecret);
  const promoteFn = useServerFn(promoteExistingUserToAdmin);
  const [mode, setMode] = useState<"create" | "promote">("create");
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "create") {
        await createFn({ data: { secret, email: email.trim(), password, fullName: fullName.trim() } });
        toast.success("تم إنشاء حساب الأدمن، الرجاء تسجيل الدخول");
      } else {
        await promoteFn({ data: { secret, email: email.trim() } });
        toast.success("تمت ترقية الحساب إلى أدمن ✅");
      }
      navigate({ to: "/admin-login", replace: true });
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-elegant border border-border p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-3">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="font-display font-black text-xl">إنشاء حساب أدمن جديد</h1>
          <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
            هذه الصفحة سرية ومخصصة فقط لمن يملك مفتاح التهيئة (ADMIN_INIT_SECRET).
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3 text-xs mb-5 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>لا تشارك مفتاح التهيئة مع أحد. بعد إنشاء أول مسؤول، أضف الباقي من لوحة التحكم.</span>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="مفتاح التهيئة (سر)" type="password" value={secret} onChange={setSecret} required />
          <Field label="الاسم الكامل" value={fullName} onChange={setFullName} required />
          <Field label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} required />
          <Field label="كلمة المرور (10 أحرف على الأقل)" type="password" value={password} onChange={setPassword} required />

          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            إنشاء حساب الأدمن
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary"
      />
    </label>
  );
}
