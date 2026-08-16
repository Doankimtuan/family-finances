"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncSavingsLifecycleAction } from "./savings-actions";

/**
 * Syncs the household savings lifecycle (legacy backfill + maturity
 * detection) once after the Savings page hydrates. Mounting in a real
 * browser session is the explicit trigger, so rendering or prefetching the
 * page never mutates financial state. Refreshes only when the sync actually
 * changed something, so the list converges to the persisted lifecycle state.
 */
export function SavingsLifecycleSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await syncSavingsLifecycleAction();
      if (cancelled || result.status !== "success") return;
      const changedCounts = [
        result.migratedCount,
        result.maturedCount,
        result.cascadeCount,
      ];
      if (changedCounts.some((count) => count > 0)) {
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
