// Kashier (Egyptian payment gateway) helpers — server only.

export function getKashierConfig() {
  return {
    merchantId: process.env["KASHIER_MERCHANT_ID"] ?? "",
    secretKey: process.env["KASHIER_SECRET_KEY"] ?? "",
    apiKey: process.env["KASHIER_API_KEY"] ?? "",
    mode: (process.env["KASHIER_MODE"] || "live").toLowerCase() === "test" ? "test" : "live",
  };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hosted Payment Page order hash: /?payment=MID.orderId.amount.currency
export async function buildKashierOrderHash(params: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  secretKey: string;
}): Promise<string> {
  const path = `/?payment=${params.merchantId}.${params.orderId}.${params.amount}.${params.currency}`;
  return hmacSha256Hex(params.secretKey, path);
}

export type KashierWebhookData = Record<string, unknown>;

// Kashier signs the callback payload with the same secret key.
export async function verifyKashierSignature(
  data: KashierWebhookData,
  signature: string | null,
  secretKey: string,
): Promise<boolean> {
  if (!signature) return false;
  const v = (k: string) => (data[k] === undefined || data[k] === null ? "" : String(data[k]));
  const queryString =
    `&paymentStatus=${v("paymentStatus")}` +
    `&cardDataToken=${v("cardDataToken")}` +
    `&maskedCard=${v("maskedCard")}` +
    `&merchantOrderId=${v("merchantOrderId")}` +
    `&orderId=${v("orderId")}` +
    `&cardBrand=${v("cardBrand")}` +
    `&orderReference=${v("orderReference")}` +
    `&transactionId=${v("transactionId")}` +
    `&amount=${v("amount")}` +
    `&currency=${v("currency")}`;
  const expected = await hmacSha256Hex(secretKey, queryString);
  return expected.toLowerCase() === signature.toLowerCase();
}
