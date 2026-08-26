import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import {
  passwordMatches,
  requireUnlocked,
  sessionConfig,
  type GateSession,
} from "./gate.server";
import { cvData } from "./cv-data.server";

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({
    password: typeof data?.password === "string" ? data.password : "",
  }))
  .handler(async ({ data }) => {
    const expected = process.env["SITE_PASSWORD"];
    if (!expected) throw new Error("SITE_PASSWORD is not set");

    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const }; // generic failure — reveal nothing more
    }

    const session = await useSession<GateSession>(sessionConfig);
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

// Protected DATA lives behind the server boundary: gated here, returned only
// when unlocked. The handler body is stripped from the client bundle, so the
// CV content never ships to locked visitors.
export const getCvContent = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked(); // before any data
  return cvData;
});

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(sessionConfig);
  await session.clear();
  return { ok: true as const };
});
