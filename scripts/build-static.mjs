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
import http from "node:http";
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

// Serve the built server bundle over plain HTTP (GET is all we need).
async function serveBuild() {
  const mod = await import(path.resolve("dist/server/index.mjs"));
  const entry = mod.default ?? mod;
  const fetchHandler = typeof entry === "function" ? entry : entry.fetch.bind(entry);
  const server = http.createServer(async (req, res) => {
    try {
      const response = await fetchHandler(new Request(ORIGIN + req.url), {}, {
        waitUntil() {},
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
  return server;
}

async function capture(urlPath) {
  const res = await fetch(ORIGIN + urlPath);
  if (!res.ok) throw new Error(`GET ${urlPath} → ${res.status}`);
  let html = await res.text();
  // The SSR payload emits asset URLs as "/./assets/…" (vite base "./").
  // Make them document-relative so the site works from any sub-path,
  // e.g. username.github.io/<repo>/.
  html = html.replaceAll("/./assets/", "./assets/");
  // Normalize literal filenames (unlock.html, index.html) to the real routes
  // before the router boots — static hosts serve the files as-is.
  const normalize =
    "<script>(function(){var p=location.pathname;" +
    'if(p.endsWith("/unlock.html"))history.replaceState(null,"",p.slice(0,-5)+location.search+location.hash);' +
    'else if(p.endsWith("/index.html"))history.replaceState(null,"",p.slice(0,-10)+location.search+location.hash);' +
    "})();</script>";
  html = html.replace("<head>", "<head>" + normalize);
  return html;
}

// 1. Production build (client + server bundles)
await run("bun", ["run", "build"]);

// 2. Serve the build and capture the two routes as HTML
const server = await serveBuild();
try {
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
  server.close();
}
