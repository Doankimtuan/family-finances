import {
  backfillLegacySavingsAccounts,
  detectMaturedSavings,
} from "./detect-matured";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type SyncSavingsLifecycleResult =
  | {
      ok: true;
      migratedCount: number;
      maturedCount: number;
      cascadeCount: number;
    }
  | { ok: false; code: ProductActionErrorCode };

/**
 * Explicit household savings lifecycle maintenance: legacy backfill, then
 * matured-cycle detection and cascade enqueueing. Invoke from a mutation
 * boundary (server action, command, or scheduled worker). Never from a
 * Savings GET / RSC / hydrate path.
 */
export async function syncSavingsLifecycle(): Promise<SyncSavingsLifecycleResult> {
  const backfill = await backfillLegacySavingsAccounts();
  if (!backfill.ok) return backfill;

  const detected = await detectMaturedSavings();
  if (!detected.ok) return detected;

  return {
    ok: true,
    migratedCount: backfill.migratedCount,
    maturedCount: detected.maturedCount,
    cascadeCount: detected.cascadeCount,
  };
}
