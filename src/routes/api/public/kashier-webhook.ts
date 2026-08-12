import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/kashier-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getKashierConfig, verifyKashierSignature } = await import("@/lib/kashier.server");
        const cfg = getKashierConfig();
        if (!cfg.secretKey) return new Response("Not configured", { status: 500 });

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const payload = body?.data ?? body ?? {};
        const signature =
          request.headers.get("x-kashier-signature") ||
          (typeof body?.signature === "string" ? body.signature : null);

        const valid = await verifyKashierSignature(payload, signature, cfg.secretKey);
        if (!valid) {
          console.error("Kashier webhook: invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        const merchantOrderId = String(payload.merchantOrderId ?? "");
        const status = String(payload.paymentStatus ?? "").toUpperCase();
        if (!merchantOrderId) return new Response("Missing order", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const paid = status === "SUCCESS";
        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: paid ? "paid" : "failed",
            ...(paid ? { status: "confirmed" as const } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", merchantOrderId);
        if (error) {
          console.error("Kashier webhook: db update failed", error.message);
          return new Response("DB error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
