import "server-only";

import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

export type RitualAutolockWorkerResult =
  | {
      ok: true;
      lockedCount: number;
      unmappedResolvedCount: number;
    }
  | { ok: false; code: ProductActionErrorCode };

/**
 * Plan V2 (BR-08 superseded): Monthly Review never auto-locks.
 * Kept as a no-op so existing page call sites remain safe during migration.
 * Unmapped-expense triage belongs to Inbox / explicit review actions, not a lock sweep.
 */
export async function runMonthRitualAutolockWorker(): Promise<RitualAutolockWorkerResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  return {
    ok: true,
    lockedCount: 0,
    unmappedResolvedCount: 0,
  };
}
