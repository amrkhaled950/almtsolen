import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  event_name: z.string().max(60),
  event_id: z.string().max(120),
  event_source_url: z.string().max(1000).optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(400).optional(),
  email: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  custom_data: z
    .object({
      value: z.number().optional(),
      currency: z.string().max(10).optional(),
      content_ids: z.array(z.string().max(120)).max(100).optional(),
      content_name: z.string().max(300).optional(),
      content_type: z.string().max(30).optional(),
      contents: z
        .array(
          z.object({
            id: z.string().max(120),
            quantity: z.number(),
            item_price: z.number().optional(),
          }),
        )
        .max(100)
        .optional(),
      num_items: z.number().optional(),
      order_id: z.string().max(120).optional(),
      search_string: z.string().max(200).optional(),
    })
    .optional(),
});

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const sendMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    const pixelId = process.env["META_PIXEL_ID"] || "1298319412394384";
    const token = process.env["META_CAPI_ACCESS_TOKEN"];
    if (!token) return { ok: false, skipped: true as const };

    const user_data: Record<string, unknown> = {};
    if (data.fbp) user_data["fbp"] = data.fbp;
    if (data.fbc) user_data["fbc"] = data.fbc;
    if (data.email) user_data["em"] = [await sha256(data.email.trim().toLowerCase())];
    if (data.phone) {
      const digits = data.phone.replace(/\D/g, "");
      if (digits) user_data["ph"] = [await sha256(digits)];
    }

    const body = {
      data: [
        {
          event_name: data.event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: data.event_id,
          event_source_url: data.event_source_url,
          action_source: "website",
          user_data,
          custom_data: data.custom_data ?? {},
        },
      ],
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        console.error("Meta CAPI error", res.status, await res.text());
        return { ok: false };
      }
      return { ok: true };
    } catch (err) {
      console.error("Meta CAPI request failed", err);
      return { ok: false };
    }
  });
