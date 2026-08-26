import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

export type GateSession = { unlocked?: boolean };

export const sessionConfig = {
  // Server-only encryption key (64-char generated secret). Never exposed to the client.
  password: process.env["SESSION_SECRET"]!,
  name: "cv-gate",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

// Hash both sides to equal-length digests first: timingSafeEqual throws on a
// length mismatch, and the raw length itself would leak through timing.
export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

// Server-only gate: throws a redirect BEFORE any protected work runs. The
// thrown redirect propagates through the loader to the router.
export async function requireUnlocked() {
  const session = await useSession<GateSession>(sessionConfig);
  if (!session.data.unlocked) throw redirect({ to: "/unlock" });
  return session;
}
