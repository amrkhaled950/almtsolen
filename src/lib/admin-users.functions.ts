import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { User } from "@supabase/supabase-js";

const emailSchema = z.string().trim().email().max(255);

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

// List all users (admin only) – joins auth users + roles + profile
export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (authErr) throw new Error(authErr.message);

    const ids = authData.users.map((u: User) => u.id);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids);

    const roleMap = new Map<string, string[]>();
    (roles || []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) || [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

    return {
      users: authData.users.map((u: User) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name: profileMap.get(u.id)?.full_name ?? (u.user_metadata?.full_name ?? null),
        phone: profileMap.get(u.id)?.phone ?? null,
        roles: roleMap.get(u.id) || [],
      })),
    };
  });

// Create a new user (admin only)
export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      email: emailSchema,
      password: z.string().min(8).max(72),
      fullName: z.string().trim().min(2).max(80),
      phone: z.string().trim().max(20).optional().or(z.literal("")),
      role: z.enum(["admin", "customer"]).default("customer"),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone || null },
    });
    if (error) throw new Error(error.message);

    // If requested admin role, add it (customer is auto-added by trigger)
    if (data.role === "admin" && created.user) {
      const { error: rErr } = await supabaseAdmin.from("user_roles").insert({
        user_id: created.user.id,
        role: "admin",
      });
      if (rErr) throw new Error(rErr.message);
    }

    return { ok: true, id: created.user?.id };
  });

// Toggle admin role for an existing user
export const setUserAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ targetUserId: z.string().uuid(), makeAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.targetUserId === userId && !data.makeAdmin) {
      throw new Error("لا يمكنك إزالة صلاحية الأدمن من حسابك");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin.from("user_roles").insert({
        user_id: data.targetUserId,
        role: "admin",
      });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.targetUserId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// Delete user (admin only)
export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    if (data.targetUserId === userId) throw new Error("لا يمكنك حذف حسابك");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.targetUserId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
