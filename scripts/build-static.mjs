// Builds the app and captures the rendered pages as static HTML in
// dist/client, producing a fully static site for GitHub Pages:
//
//   dist/client/index.html   — the CV (client-gated, redirects to /unlock)
//   dist/client/unlock.html  — the passphrase screen (GitHub Pages serves
//                              this for /unlock)
//   dist/client/404.html     — copy of index.html so deep links still boot
//                              the app
//
// The site needs no server at runtime: the CV ships as AES-GCM ciphertext
// and is decrypted in the browser with the visitor's passphrase.
//
// Usage: bun run build:static   (or: node scripts/build-static.mjs)

import { spawn } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve("dist/client");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

async function waitForServer(timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(ORIGIN + "/unlock");
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server did not start on ${ORIGIN}`);
}

async function capture(urlPath) {
  const res = await fetch(ORIGIN + urlPath);
  if (!res.ok) throw new Error(`GET ${urlPath} → ${res.status}`);
  return await res.text();
}

// 1. Production build (client + server bundles)
await run("bun", ["run", "build"]);

// 2. Serve the build and capture the two routes as HTML
const preview = spawn("bunx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
});
try {
  await waitForServer();

  const [indexHtml, unlockHtml] = await Promise.all([capture("/"), capture("/unlock")]);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "index.html"), indexHtml);
  // unlock.html (not unlock/index.html) so relative ./assets URLs resolve
  // from every page, including on project sites served from a sub-path.
  await writeFile(path.join(OUT_DIR, "unlock.html"), unlockHtml);
  await copyFile(path.join(OUT_DIR, "index.html"), path.join(OUT_DIR, "404.html"));

  console.log("\nStatic site written to dist/client:");
  console.log("  index.html, unlock.html, 404.html, assets/");
} finally {
  preview.kill();
}
