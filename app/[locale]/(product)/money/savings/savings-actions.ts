"use server";

import {
  createSaving,
  settleSaving,
  renewSaving,
  updateRenewalPolicy,
  previewEarlyWithdrawalForSaving,
  confirmEarlyWithdrawal,
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
  enrichSavingsMaturityInboxItems,
  enqueueEarlyWithdrawalInboxItem,
  executeSavingsMaturityWorkflow,
  executeEarlyWithdrawalWorkflow,
  type CreateSavingInput,
  type UpdateRenewalPolicyInput,
} from "@/modules/savings/application";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  type InboxCommandErrorCode,
} from "@/modules/inbox/application";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  revalidateInboxViews,
  revalidateSavingsInboxViews,
  revalidateSavingsViews,
} from "@/app/mutation-revalidation";

export type SavingsActionState =
  | {
      status: "success";
      id?: string;
      cycleId?: string;
      inboxItemId?: string;
      netAmount?: number;
    }
  | { status: "error"; code: ProductActionErrorCode };

type SavingsInboxActionState =
  | Exclude<SavingsActionState, { status: "error" }>
  | { status: "error"; code: ProductActionErrorCode | InboxCommandErrorCode };

/** Create saving via ledger-funded RPC (replaces legacy savings_accounts writes). */
export async function createSavingAction(
  input: CreateSavingInput,
): Promise<SavingsActionState> {
  const result = await createSaving(input);
  if (!result.ok) return { status: "error", code: result.code };
  revalidateSavingsViews();
  return { status: "success", id: result.savingId, cycleId: result.cycleId };
}

export async function settleSavingAction(input: {
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsActionState> {
  const result = await settleSaving(input);
  if (!result.ok) return { status: "error", code: result.code };
  revalidateSavingsViews();
  return {
    status: "success",
    id: result.savingId,
    cycleId: result.cycleId,
    netAmount: result.netAmount,
  };
}
export async function renewSavingAction(
  input: Parameters<typeof renewSaving>[0],
): Promise<SavingsActionState> {
  const result = await renewSaving(input);
  if (!result.ok) return { status: "error", code: result.code };
  revalidateSavingsViews();
  return {
    status: "success",
    id: result.savingId,
    cycleId: result.cycleId,
    netAmount: result.principal,
  };
}
export async function updateRenewalPolicyAction(
  input: UpdateRenewalPolicyInput,
): Promise<SavingsActionState> {
  const result = await updateRenewalPolicy(input);
  if (!result.ok) return { status: "error", code: result.code };
  revalidateSavingsViews();
  return { status: "success", id: result.savingId };
}

/** @deprecated Legacy path disabled — use createSavingAction. */
export async function createSavingsAction(input: {
  name: string;
  principalAmount: number;
  maturityDate: string;
  note?: string;
}): Promise<SavingsActionState> {
  void input;
  return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.INVALID };
}

export async function detectMaturedSavingsAction(): Promise<SavingsActionState> {
  const result = await detectMaturedSavings();
  if (!result.ok) return { status: "error", code: result.code };

  const gate = await assertMoneyActionAllowed();
  let enrichmentSucceeded = true;
  if (gate.ok) {
    enrichmentSucceeded = await enrichSavingsMaturityInboxItems({
      householdId: gate.householdId,
    });
  }

  if (
    enrichmentSucceeded &&
    (result.maturedCount > 0 || result.cascadeCount > 0)
  ) {
    revalidateSavingsInboxViews();
  }
  return { status: "success" };
}

export async function backfillLegacySavingsAction(): Promise<SavingsActionState> {
  const result = await backfillLegacySavingsAccounts();
  if (!result.ok) return { status: "error", code: result.code };
  if (result.migratedCount > 0) revalidateSavingsViews();
  return { status: "success" };
}

export type SavingsLifecycleSyncState =
  | {
      status: "success";
      migratedCount: number;
      maturedCount: number;
      cascadeCount: number;
    }
  | { status: "error"; code: ProductActionErrorCode };

/**
 * One explicit trigger for the household savings lifecycle writes (legacy
 * backfill, then maturity detection + cascade reminders). Runs as a server
 * action POST after a real browser visit — never during a page render or
 * prefetch, which must stay free of business-data mutations.
 */
export async function syncSavingsLifecycleAction(): Promise<SavingsLifecycleSyncState> {
  // Backfill failure must not block detection; both ran independently when
  // the page triggered them during render.
  const backfill = await backfillLegacySavingsAccounts();
  const detected = await detectMaturedSavings();
  if (!detected.ok) return { status: "error", code: detected.code };
  const migratedCount = backfill.ok ? backfill.migratedCount : 0;
  if (
    migratedCount > 0 ||
    detected.maturedCount > 0 ||
    detected.cascadeCount > 0
  ) {
    revalidateSavingsInboxViews();
  }
  return {
    status: "success",
    migratedCount,
    maturedCount: detected.maturedCount,
    cascadeCount: detected.cascadeCount,
  };
}

/** Preview + enqueue typed Inbox early-withdrawal confirmation (orchestration). */
export async function requestEarlyWithdrawalAction(input: {
  savingId: string;
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsActionState> {
  const previewed = await previewEarlyWithdrawalForSaving(input);
  if (!previewed.ok) return { status: "error", code: previewed.code };

  if (
    !previewed.preview.quoteReady ||
    previewed.preview.netReturned == null ||
    previewed.preview.eligibleInterest == null ||
    previewed.preview.penaltyAmount == null
  ) {
    return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      status: "error",
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const { eligibleInterest, penaltyAmount, netReturned } = previewed.preview;
  const result = await enqueueEarlyWithdrawalInboxItem({
    context: { householdId: gate.householdId },
    savingId: input.savingId,
    cycleId: input.cycleId,
    preview: {
      ...previewed.preview,
      eligibleInterest,
      penaltyAmount,
      netReturned,
    },
    settlementAccountId: previewed.settlementAccountId,
    warnPenalty: previewed.warnPenalty,
    productName: previewed.productName,
  });
  if (result.status === "error") {
    return {
      status: "error",
      code: isProductActionErrorCode(result.code)
        ? result.code
        : PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    };
  }
  revalidateInboxViews();
  return result;
}

function isProductActionErrorCode(
  code: ProductActionErrorCode | InboxCommandErrorCode,
): code is ProductActionErrorCode {
  return (Object.values(PRODUCT_ACTION_ERROR_CODE) as string[]).includes(code);
}

export async function confirmEarlyWithdrawalAction(input: {
  savingId: string;
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsActionState> {
  const result = await confirmEarlyWithdrawal(input);
  if (!result.ok) return { status: "error", code: result.code };
  revalidateSavingsInboxViews();
  return {
    status: "success",
    id: result.savingId,
    cycleId: result.cycleId,
    netAmount: result.netReturned,
  };
}

/**
 * Move money via savings commands first, then resolve Inbox (BR-01 / BR-10).
 * Non-money actions may acknowledge immediately.
 */
export async function acknowledgeSavingsMaturityAction(input: {
  inboxItemId: string;
  action: string;
  cycleId: string;
  savingId: string;
  packageId?: string;
  settlementAccountId?: string;
  settlementRule?: string;
  renewalPolicyAfter?: UpdateRenewalPolicyInput["renewalPolicy"];
  renewalConfig?: UpdateRenewalPolicyInput["renewalConfig"];
}): Promise<SavingsInboxActionState> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      status: "error",
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }
  const result = await executeSavingsMaturityWorkflow({
    context: { householdId: gate.householdId },
    ...input,
  });
  if (result.status === "error") return result;
  if (
    input.action === SavingsMaturityAckAction.REMIND_TOMORROW ||
    input.action === SavingsMaturityAckAction.DISMISS
  ) {
    revalidateInboxViews();
  } else {
    revalidateSavingsInboxViews();
  }
  return result;
}

export async function acknowledgeEarlyWithdrawalAction(input: {
  inboxItemId: string;
  action: string;
  savingId: string;
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsInboxActionState> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      status: "error",
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }
  const result = await executeEarlyWithdrawalWorkflow({
    context: { householdId: gate.householdId },
    ...input,
  });
  if (result.status === "error") return result;
  if (input.action === EarlyWithdrawalAckAction.CONFIRM) {
    revalidateSavingsInboxViews();
  } else {
    revalidateInboxViews();
  }
  return result;
}
