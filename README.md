# Private CV Website

An interactive, passphrase-protected CV site that deploys to GitHub Pages as a
fully static site.

## How the protection works

The CV content and portrait photo are stored **only as AES-GCM-256 ciphertext**
(`src/lib/cv-payload.ts`). When a visitor enters the passphrase, the browser
derives a decryption key with PBKDF2-SHA256 (600,000 iterations) and decrypts
everything locally. The passphrase and plaintext never appear in the shipped
files, and no server is involved. The unlocked content is kept in
`sessionStorage` (per tab, cleared when the tab closes) and can be cleared any
time with the **Lock** button.

> Note: with any purely static site, the ciphertext is public by definition —
> security rests entirely on the strength of the passphrase. Choose a long one.

## Editing the CV

1. Edit `scripts/cv-source.json` (all CV content) and/or replace
   `src/assets/portrait.jpg`.
2. Re-encrypt the payload:

   ```sh
   SITE_PASSWORD="your-secret-passphrase" node scripts/encrypt-cv.mjs
   ```

   To change the passphrase, just run the command again with the new one.

## Deploying to GitHub Pages

### Option A — GitHub Actions (recommended)

The repo includes `.github/workflows/deploy.yml`. Push to `main`, then in the
GitHub repo go to **Settings → Pages → Source → GitHub Actions**. Every push
builds and deploys automatically.

### Option B — Manual

```sh
bun install          # or npm install
bun run build:static # or npm run build:static
```

Upload the contents of `dist/client/` to any static host, or push it to a
`gh-pages` branch.

### Project sites (username.github.io/&lt;repo&gt;/)

If the repo is **not** named `username.github.io`, the site lives under a
sub-path. Build with:

```sh
VITE_BASEPATH="/<repo>" bun run build:static
```

The included GitHub Actions workflow sets this automatically.

## Development

```sh
bun install
SITE_PASSWORD="..." bun run dev
```
