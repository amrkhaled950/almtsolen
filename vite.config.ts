// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// When deploying on Vercel, force the nitro Vercel preset and route its
// output to the directory Vercel auto-detects (`.vercel/output`).
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ...(isVercel
    ? {
        nitro: {
          preset: "vercel",
          output: {
            dir: ".vercel/output",
            publicDir: ".vercel/output/static",
            serverDir: ".vercel/output/functions/__server.func",
          },

        },
      }
    : {}),
});
