import { useState } from "react";
import { LockKeyhole, Fingerprint, ArrowRight } from "lucide-react";
import {
  IS_OPEN,
  readOpenPayload,
  saveUnlocked,
  unlockWithPassphrase,
  type UnlockedCv,
} from "@/lib/crypto";
import { cn } from "@/lib/utils";

// Passphrase screen. Rendered both at /unlock and inline on "/" when the tab
// has no decrypted payload — no navigation involved, so it works on any static
// host and sub-path (GitHub Pages project sites included).
export function UnlockScreen({ onUnlocked }: { onUnlocked: (value: UnlockedCv) => void }) {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Open build (no passphrase configured): the screen is shown for reference
    // only — Continue reveals the CV without any input.
    if (IS_OPEN) {
      const open = readOpenPayload();
      saveUnlocked(open);
      onUnlocked(open);
      return;
    }
    setPending(true);
    setError(false);
    try {
      const password = new FormData(e.currentTarget).get("password") as string;
      const unlocked = await unlockWithPassphrase(password);
      if (unlocked) {
        saveUnlocked(unlocked);
        onUnlocked(unlocked);
      } else {
        setError(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-blueprint-grid" />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-grid-lg" />

      <div
        className={cn(
          "relative w-full max-w-md border border-border bg-card p-8 shadow-[0_24px_60px_-24px_oklch(0.448_0.105_256/0.25)] sm:p-10",
          error && "animate-shake",
        )}
      >
        <div className="corner-ticks pointer-events-none absolute inset-0" aria-hidden="true" />

        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-markup">
          Restricted document
        </p>

        <div className="mt-6 flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-border bg-blueprint-soft text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Curriculum Vitae
            </h1>
            <p className="font-mono text-xs text-muted-foreground">ref. KV-2026 / private</p>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          This résumé is shared privately. Enter the passphrase you were given to view it.
        </p>

        <form onSubmit={onSubmit} method="post" className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
              Passphrase
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              placeholder="••••••••••••"
              // text-base (16px) minimum: iOS Safari auto-zooms the page when
              // focusing any input below 16px, and that zoom sticks after
              // unlock and across reloads.
              className="w-full border border-input bg-background px-4 py-3 font-mono text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>

          {error && (
            <p className="border-l-2 border-destructive bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              Incorrect passphrase. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="group flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-sm font-medium uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? "Decrypting…" : "Unlock"}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>
        </form>
      </div>

      <p className="absolute bottom-6 px-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
        AES-256 encrypted · the passphrase never leaves your browser
      </p>
    </main>
  );
}
