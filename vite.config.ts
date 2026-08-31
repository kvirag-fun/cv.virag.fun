// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Relative asset URLs so the static build works from any sub-path
    // (e.g. username.github.io/<repo>/).
    base: "./",
    resolve: {
      alias: [
        // Local dev: when scripts/encrypt-cv.mjs generated a git-ignored
        // cv-payload.local.ts from the real (git-ignored) cv-source.json,
        // use it instead of the committed placeholder payload.
        ...(existsSync(new URL("./src/lib/cv-payload.local.ts", import.meta.url))
          ? [
              {
                find: "@/lib/cv-payload",
                replacement: fileURLToPath(
                  new URL("./src/lib/cv-payload.local.ts", import.meta.url),
                ),
              },
            ]
          : []),
      ],
    },
  },
  // Static hosting: `bun run build:static` builds normally, then captures the
  // rendered pages into dist/client as plain HTML (see scripts/build-static.mjs).
  // All protection is client-side AES-GCM decryption — no server at runtime.
});
