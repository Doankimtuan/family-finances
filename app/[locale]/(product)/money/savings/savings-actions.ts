"use server";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  createSaving,
  settleSaving,
  renewSaving,
  updateRenewalPolicy,
  previewEarlyWithdrawalForSaving,
  confirmEarlyWithdrawal,
  detectMaturedSavings,
  buildMaturityReviewPayload,
  backfillLegacySavingsAccounts,
  SettlementAction,
  SettlementRule,
  RenewalDecisionSource,
  type CreateSavingInput,
  type UpdateRenewalPolicyInput,
} from "@/modules/savings/application";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
  acknowledgeInboxItem,
} from "@/modules/inbox/application";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";

export type SavingsActionState =
  | {
      status: "success";
      id?: string;
      cycleId?: string;
      inboxItemId?: string;
      netAmount?: number;
    }
  | { status: "error"; code: ProductActionErrorCode };

/** Create saving via ledger-funded RPC (replaces legacy savings_accounts writes). */
export async function createSavingAction(
  input: CreateSavingInput,
): Promise<SavingsActionState> {
  const result = await createSaving(input);
  if (!result.ok) return { status: "error", code: result.code };
  return { status: "success", id: result.savingId, cycleId: result.cycleId };
}

export async function settleSavingAction(input: {
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsActionState> {
  const result = await settleSaving(input);
  if (!result.ok) return { status: "error", code: result.code };
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

  // App orchestration: hydrate Inbox ReviewItems (savings ↛ inbox).
  const gate = await assertMoneyActionAllowed();
  if (gate.ok) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: pendingItems } = await supabase
        .from("inbox_items")
        .select("id, source_id, context_json")
        .eq("household_id", gate.householdId)
        .eq("kind", InboxItemKind.SAVINGS_MATURED)
        .eq("status", InboxItemStatus.PENDING);

      for (const item of pendingItems ?? []) {
        const ctx = (item.context_json ?? {}) as Record<string, unknown>;
        const savingId = String(ctx.savingId ?? item.source_id);
        const cycleId = typeof ctx.cycleId === "string" ? ctx.cycleId : null;
        if (!cycleId) continue;

        const enriched = await buildMaturityReviewPayload({
          savingId,
          cycleId,
        });
        if (!enriched) continue;

        await supabase
          .from("inbox_items")
          .update({
            context_json: {
              ...ctx,
              ...enriched,
              configuredRenewalPreference: enriched.renewalPolicy,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
    } catch {
      // Detect succeeded; enrichment failure is non-fatal for list refresh.
    }
  }

  return { status: "success" };
}

export async function backfillLegacySavingsAction(): Promise<SavingsActionState> {
  const result = await backfillLegacySavingsAccounts();
  if (!result.ok) return { status: "error", code: result.code };
  return { status: "success" };
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
    return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: household } = await supabase
      .from("households")
      .select("base_currency")
      .eq("id", gate.householdId)
      .maybeSingle();

    const currency = (
      household?.base_currency ?? DEFAULT_CURRENCY
    ).toUpperCase();

    const context = {
      savingId: input.savingId,
      cycleId: input.cycleId,
      principal: previewed.preview.principal,
      accruedInterest: previewed.preview.accruedInterest,
      eligibleInterest: previewed.preview.eligibleInterest,
      penaltyAmount: previewed.preview.penaltyAmount,
      netReturned: previewed.preview.netReturned,
      penaltyStrategy: previewed.preview.penaltyStrategy,
      daysHeld: previewed.preview.daysHeld,
      totalTermDays: previewed.preview.totalTermDays,
      quoteReady: previewed.preview.quoteReady,
      settlementAccountId: previewed.settlementAccountId,
      warnPenalty: previewed.warnPenalty,
      cascadeDay: "early",
    };

    const title = `${previewed.productName} - Early withdrawal`;

    const { data, error } = await supabase
      .from("inbox_items")
      .insert({
        household_id: gate.householdId,
        kind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
        status: InboxItemStatus.PENDING,
        source_type: InboxSourceType.GUIDED,
        source_id: input.savingId,
        amount: previewed.preview.netReturned,
        currency,
        title,
        context_json: context,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      const { data: updated, error: upErr } = await supabase
        .from("inbox_items")
        .update({
          status: InboxItemStatus.PENDING,
          amount: previewed.preview.netReturned,
          title,
          context_json: context,
          updated_at: new Date().toISOString(),
        })
        .eq("household_id", gate.householdId)
        .eq("source_type", InboxSourceType.GUIDED)
        .eq("source_id", input.savingId)
        .eq("kind", InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION)
        .select("id")
        .maybeSingle();

      if (upErr || !updated) {
        return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }

      return {
        status: "success",
        id: updated.id,
        inboxItemId: updated.id,
      };
    }

    if (!data) {
      return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return {
      status: "success",
      id: data.id,
      inboxItemId: data.id,
    };
  } catch {
    return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function confirmEarlyWithdrawalAction(input: {
  savingId: string;
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsActionState> {
  const result = await confirmEarlyWithdrawal(input);
  if (!result.ok) return { status: "error", code: result.code };
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
}): Promise<SavingsActionState> {
  if (
    input.action === SavingsMaturityAckAction.REMIND_TOMORROW ||
    input.action === SavingsMaturityAckAction.DISMISS
  ) {
    const ack = await acknowledgeInboxItem({
      inboxItemId: input.inboxItemId,
      action: input.action,
    });
    if (!ack.ok) return { status: "error", code: ack.code };
    return { status: "success" };
  }

  const rule = input.settlementRule;
  const shouldWithdraw =
    input.action === SavingsMaturityAckAction.WITHDRAW ||
    ((input.action === SavingsMaturityAckAction.CONFIRM_CONFIGURED ||
      input.action === SavingsMaturityAckAction.CHANGE_SETTLEMENT) &&
      rule === SettlementRule.WITHDRAW_EVERYTHING);

  const decisionSource =
    input.action === SavingsMaturityAckAction.CONFIRM_CONFIGURED
      ? RenewalDecisionSource.POLICY_APPLIED
      : RenewalDecisionSource.MANUAL;

  if (shouldWithdraw) {
    const settled = await settleSaving({
      cycleId: input.cycleId,
      settlementAccountId: input.settlementAccountId,
      decisionSource,
    });
    if (!settled.ok) return { status: "error", code: settled.code };

    if (input.renewalPolicyAfter) {
      await updateRenewalPolicy({
        savingId: input.savingId,
        renewalPolicy: input.renewalPolicyAfter,
        renewalConfig: input.renewalConfig,
      });
    }

    await acknowledgeInboxItem({
      inboxItemId: input.inboxItemId,
      action: input.action,
    });

    return {
      status: "success",
      id: settled.savingId,
      cycleId: settled.cycleId,
      netAmount: settled.netAmount,
    };
  }

  const rollAction =
    rule === SettlementRule.ROLL_PRINCIPAL_ONLY
      ? SettlementAction.ROLL_PRINCIPAL_ONLY
      : SettlementAction.ROLL_PRINCIPAL_INTEREST;

  const renewed = await renewSaving({
    cycleId: input.cycleId,
    action: rollAction,
    packageId: input.packageId,
    settlementAccountId: input.settlementAccountId,
    decisionSource,
    renewalPolicyAfter: input.renewalPolicyAfter,
  });
  if (!renewed.ok) return { status: "error", code: renewed.code };

  if (input.renewalConfig && input.renewalPolicyAfter) {
    await updateRenewalPolicy({
      savingId: input.savingId,
      renewalPolicy: input.renewalPolicyAfter,
      renewalConfig: input.renewalConfig,
    });
  }

  await acknowledgeInboxItem({
    inboxItemId: input.inboxItemId,
    action: input.action,
  });

  return {
    status: "success",
    id: renewed.savingId,
    cycleId: renewed.cycleId,
  };
}

export async function acknowledgeEarlyWithdrawalAction(input: {
  inboxItemId: string;
  action: string;
  savingId: string;
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsActionState> {
  if (input.action !== EarlyWithdrawalAckAction.CONFIRM) {
    const ack = await acknowledgeInboxItem({
      inboxItemId: input.inboxItemId,
      action: input.action,
    });
    if (!ack.ok) return { status: "error", code: ack.code };
    return { status: "success" };
  }

  const confirmed = await confirmEarlyWithdrawal({
    savingId: input.savingId,
    cycleId: input.cycleId,
    settlementAccountId: input.settlementAccountId,
  });
  if (!confirmed.ok) return { status: "error", code: confirmed.code };

  await acknowledgeInboxItem({
    inboxItemId: input.inboxItemId,
    action: input.action,
  });

  return {
    status: "success",
    id: confirmed.savingId,
    netAmount: confirmed.netReturned,
  };
}
