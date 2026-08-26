import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadUnlocked } from "@/lib/crypto";
import { UnlockScreen } from "@/components/cv/unlock-screen";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Private Document" },
      { name: "description", content: "This document is private. Enter the passphrase to view it." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();

  // Already unlocked in this tab session? Go straight to the document.
  useEffect(() => {
    if (loadUnlocked()) void router.navigate({ to: "/" });
  }, [router]);

  return <UnlockScreen onUnlocked={() => void router.navigate({ to: "/" })} />;
}
