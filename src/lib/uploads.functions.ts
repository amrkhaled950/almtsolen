import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "site-assets";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

async function ensureBucket(admin: any) {
  const { data: list } = await admin.storage.listBuckets();
  if (list?.some((b: any) => b.name === BUCKET)) return;
  await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
}

export const uploadAssetAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { folder?: string; filename: string; contentType: string; dataBase64: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await ensureBucket(supabaseAdmin);

    const buf = Buffer.from(data.dataBase64, "base64");
    if (buf.byteLength > 10 * 1024 * 1024) throw new Error("File too large (max 10MB)");

    const folder = (data.folder || "misc").replace(/[^a-zA-Z0-9_-]/g, "");
    const path = `${folder}/${Date.now()}_${sanitizeName(data.filename)}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
