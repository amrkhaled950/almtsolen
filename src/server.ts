import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  try {
    return await serverEntryPromise;
  } catch (error) {
    serverEntryPromise = undefined;
    throw error;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readCatastrophicSsrBody(response: Response): Promise<string | undefined> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return undefined;
  }

  return body;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  const body = await readCatastrophicSsrBody(response);
  if (!body) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const canRetry = request.method === "GET" || request.method === "HEAD";
    const delays = canRetry ? [0, 250, 500, 1000, 1500] : [0];
    let lastError: unknown;

    for (const delay of delays) {
      if (delay) await wait(delay);
      try {
        const handler = await getServerEntry();
        const response = await handler.fetch(request, env, ctx);
        const catastrophicBody = await readCatastrophicSsrBody(response);

        if (catastrophicBody && delay !== delays[delays.length - 1]) {
          lastError = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${catastrophicBody}`);
          serverEntryPromise = undefined;
          continue;
        }

        return await normalizeCatastrophicSsrResponse(response);
      } catch (error) {
        lastError = error;
        serverEntryPromise = undefined;
        if (delay !== delays[delays.length - 1]) continue;
      }
    }

    console.error(lastError);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
