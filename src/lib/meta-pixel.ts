// Meta (Facebook) Pixel + Conversions API helper.
// The browser pixel fires immediately; the same event (identical event_id)
// is mirrored server-side through the Conversions API for deduplication.
import { sendMetaEvent } from "./meta-capi.functions";

export const META_PIXEL_ID = "1298319412394384";

type Contents = { id: string; quantity: number; item_price?: number };

export type MetaEventData = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Contents[];
  num_items?: number;
  order_id?: string;
  search_string?: string;
};

declare global {
  interface Window {
    fbq?: any;
    _fbq?: unknown;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]!) : undefined;
}

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function initMetaPixel() {
  if (typeof window === "undefined" || window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: any, e: string, v: string) {
    let n: any, t: any, s: any;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq?.("init", META_PIXEL_ID);
}

export function trackMeta(
  eventName: string,
  data?: MetaEventData,
  user?: { email?: string; phone?: string },
) {
  if (typeof window === "undefined") return;
  const eventId = newEventId();
  try {
    window.fbq?.("track", eventName, data ?? {}, { eventID: eventId });
  } catch {
    /* ignore */
  }
  void sendMetaEvent({
    data: {
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      email: user?.email,
      phone: user?.phone,
      custom_data: data,
    },
  }).catch(() => {});
}
