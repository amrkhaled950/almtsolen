import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Customer self-signup that auto-confirms the email so users never need
// to verify their inbox. Uses the admin client server-side.
export const customerSignUp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().min(2).max(80),
        phone: z.string().trim().max(20).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone || null,
      },
    });
    if (error) {
      // Friendly message for duplicate emails
      if (/registered|exists|duplicate/i.test(error.message)) {
        throw new Error("هذا البريد مسجل بالفعل، حاول تسجيل الدخول");
      }
      throw new Error(error.message);
    }
    return { ok: true, id: created.user?.id };
  });

// Hidden admin bootstrap — creates an admin account when the caller knows
// the ADMIN_INIT_SECRET stored as a server secret. The route that calls
// this should not be linked anywhere in the UI.
export const createAdminWithSecret = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        secret: z.string().min(8).max(200),
        email: z.string().trim().email().max(255),
        password: z.string().min(10).max(72),
        fullName: z.string().trim().min(2).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_INIT_SECRET;
    if (!expected) {
      throw new Error("Admin bootstrap is disabled (ADMIN_INIT_SECRET not set)");
    }
    if (data.secret !== expected) {
      // Generic message to avoid leaking which field was wrong
      throw new Error("بيانات غير صحيحة");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error) {
      if (/registered|exists|duplicate/i.test(error.message)) {
        throw new Error("هذا البريد مسجل بالفعل");
      }
      throw new Error(error.message);
    }
    if (!created.user) throw new Error("فشل إنشاء الحساب");

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      throw new Error(roleErr.message);
    }

    return { ok: true, id: created.user.id };
  });
