import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  order_id: z.string().uuid(),
});

export const createKashierCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }): Promise<{ url: string }> => {
    const { getKashierConfig, buildKashierOrderHash } = await import("./kashier.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    const cfg = getKashierConfig();
    if (!cfg.merchantId || !cfg.secretKey) {
      throw new Error("Kashier is not configured");
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, guest_name, guest_phone, guest_email, payment_status")
      .eq("id", data.order_id)
      .single();
    if (error || !order) throw new Error("Order not found");
    if (order.payment_status === "paid") throw new Error("Order already paid");

    const amount = Number(order.total).toFixed(2);
    const currency = "EGP";
    const orderId = order.order_number;
    const hash = await buildKashierOrderHash({
      merchantId: cfg.merchantId,
      orderId,
      amount,
      currency,
      secretKey: cfg.secretKey,
    });

    const origin =
      getRequestHeader("origin") ||
      (getRequestHeader("host") ? `https://${getRequestHeader("host")}` : "https://www.almotasolen.com");

    const params = new URLSearchParams({
      merchantId: cfg.merchantId,
      orderId,
      amount,
      currency,
      hash,
      mode: cfg.mode,
      merchantRedirect: `${origin}/payment-result`,
      serverWebhook: `${origin}/api/public/kashier-webhook`,
      allowedMethods: "card",
      display: "ar",
      redirectMethod: "get",
      failureRedirect: "true",
      metaData: JSON.stringify({ order_id: order.id }),
    });
    if (order.guest_email) params.set("customer[email]", order.guest_email);
    if (order.guest_phone) params.set("customer[phone]", order.guest_phone);

    return { url: `https://checkout.kashier.io/?${params.toString()}` };
  });
