import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, ShieldCheck, ShieldOff, Loader2, Eye, EyeOff, X, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminUsers, createAdminUser, setUserAdminRole, deleteAdminUser,
} from "@/lib/admin-users.functions";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const locale = useLocale((s) => s.locale);
  const isAr = locale === "ar";
  const { user: me } = useAuth();
  const qc = useQueryClient();

  const fetchUsers = useServerFn(listAdminUsers);
  const createFn = useServerFn(createAdminUser);
  const setRoleFn = useServerFn(setUserAdminRole);
  const deleteFn = useServerFn(deleteAdminUser);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  const [open, setOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: (input: any) => createFn({ data: input }),
    onSuccess: () => {
      toast.success(isAr ? "تم إنشاء المستخدم" : "User created");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const roleMut = useMutation({
    mutationFn: (v: { targetUserId: string; makeAdmin: boolean }) => setRoleFn({ data: v }),
    onSuccess: () => {
      toast.success(isAr ? "تم تحديث الصلاحية" : "Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (v: { targetUserId: string }) => deleteFn({ data: v }),
    onSuccess: () => {
      toast.success(isAr ? "تم حذف المستخدم" : "User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl flex items-center gap-2">
            <UserCog className="h-7 w-7 text-primary" />
            {isAr ? "المستخدمون والصلاحيات" : "Users & roles"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "إدارة حسابات المسؤولين والعملاء" : "Manage admin and customer accounts"}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> {isAr ? "إضافة مستخدم" : "Add user"}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="text-start">
                  <th className="text-start px-4 py-3 font-semibold">{isAr ? "المستخدم" : "User"}</th>
                  <th className="text-start px-4 py-3 font-semibold">{isAr ? "البريد" : "Email"}</th>
                  <th className="text-start px-4 py-3 font-semibold">{isAr ? "الصلاحيات" : "Roles"}</th>
                  <th className="text-start px-4 py-3 font-semibold">{isAr ? "آخر دخول" : "Last sign in"}</th>
                  <th className="text-end px-4 py-3 font-semibold">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const isMe = u.id === me?.id;
                  const isAdmin = u.roles.includes("admin");
                  return (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                            {(u.full_name?.[0] || u.email?.[0] || "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{u.full_name || "—"} {isMe && <span className="text-xs text-muted-foreground">({isAr ? "أنت" : "you"})</span>}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isAdmin && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">admin</span>}
                          {u.roles.includes("customer") && <span className="px-2 py-0.5 rounded-full bg-muted text-foreground/70 text-xs">customer</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString(isAr ? "ar-EG" : "en-US") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={isMe || roleMut.isPending}
                            onClick={() => roleMut.mutate({ targetUserId: u.id, makeAdmin: !isAdmin })}
                            className="h-8 px-2 rounded-md hover:bg-muted text-xs flex items-center gap-1 disabled:opacity-40"
                            title={isAdmin ? (isAr ? "إزالة admin" : "Remove admin") : (isAr ? "تعيين admin" : "Make admin")}
                          >
                            {isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                            {isAdmin ? (isAr ? "إزالة" : "Demote") : (isAr ? "ترقية" : "Promote")}
                          </button>
                          <button
                            disabled={isMe || deleteMut.isPending}
                            onClick={() => {
                              if (confirm(isAr ? "تأكيد حذف هذا المستخدم؟" : "Delete this user?")) {
                                deleteMut.mutate({ targetUserId: u.id });
                              }
                            }}
                            className="grid h-8 w-8 place-items-center rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">{isAr ? "لا يوجد مستخدمون" : "No users"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <CreateUserModal isAr={isAr} onClose={() => setOpen(false)} onSubmit={(v) => createMut.mutate(v)} busy={createMut.isPending} />}
    </div>
  );
}

function CreateUserModal({
  isAr, onClose, onSubmit, busy,
}: { isAr: boolean; onClose: () => void; onSubmit: (v: any) => void; busy: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "customer">("customer");
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-bold text-xl">{isAr ? "إضافة مستخدم جديد" : "Add new user"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit({ email, password, fullName, phone, role }); }}
          className="p-5 space-y-3"
        >
          <Field label={isAr ? "الاسم الكامل" : "Full name"}>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary" />
          </Field>
          <Field label={isAr ? "البريد الإلكتروني" : "Email"}>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary" />
          </Field>
          <Field label={isAr ? "كلمة المرور" : "Password"}>
            <div className="relative">
              <input required minLength={8} type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 pe-9 rounded-lg border border-input bg-background focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label={isAr ? "الهاتف (اختياري)" : "Phone (optional)"}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary" />
          </Field>
          <Field label={isAr ? "الصلاحية" : "Role"}>
            <select value={role} onChange={(e) => setRole(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:border-primary">
              <option value="customer">{isAr ? "عميل" : "Customer"}</option>
              <option value="admin">{isAr ? "مسؤول (Admin)" : "Admin"}</option>
            </select>
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-input hover:bg-muted font-semibold">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button disabled={busy} type="submit" className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAr ? "إنشاء" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
