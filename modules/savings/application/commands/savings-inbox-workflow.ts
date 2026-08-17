import { acknowledgeInboxItem } from "@/modules/inbox/application/commands/review-items";
import {
  listPendingSavingsMaturityInboxItems,
  updateSavingsMaturityInboxItem,
  upsertSavingsEarlyWithdrawalInboxItem,
  type SavingsEarlyWithdrawalInboxContext,
} from "@/modules/inbox/application/commands/savings-workflow";
import type { InboxCommandErrorCode } from "@/modules/inbox/application/inbox-error";
import {
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  SAVINGS_INBOX_CONTEXT,
} from "@/modules/inbox/application/inbox-constants";
import { getHouseholdBaseCurrency } from "@/modules/tenancy/application/get-household-base-currency";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import {
  SettlementAction,
  SettlementRule,
  RenewalDecisionSource,
  SAVINGS_OPERATION,
} from "../savings-constants";
import { logSavingsFailure } from "../savings-error";
import { buildMaturityReviewPayload } from "./detect-matured";
import { confirmEarlyWithdrawal } from "./early-withdraw";
import { settleSaving, renewSaving } from "./settle-saving";
import {
  updateRenewalPolicy,
  type UpdateRenewalPolicyInput,
} from "./update-renewal-policy";

export type SavingsWorkflowContext = Readonly<{ householdId: string }>;
export type SavingsWorkflowResult =
  | {
      status: "success";
      id?: string;
      cycleId?: string;
      inboxItemId?: string;
      netAmount?: number;
    }
  | { status: "error"; code: ProductActionErrorCode | InboxCommandErrorCode };

export async function enrichSavingsMaturityInboxItems(
  context: SavingsWorkflowContext,
): Promise<boolean> {
  try {
    const items = await listPendingSavingsMaturityInboxItems(
      context.householdId,
    );
    if (!items) return false;
    for (const item of items) {
      const enriched = await buildMaturityReviewPayload({
        savingId: item.savingId,
        cycleId: item.cycleId,
      });
      if (!enriched) continue;
      await updateSavingsMaturityInboxItem({
        householdId: context.householdId,
        inboxItemId: item.inboxItemId,
        context: {
          ...item.context,
          ...enriched,
          configuredRenewalPreference: enriched.renewalPolicy,
        },
      });
    }
    return true;
  } catch (error) {
    logSavingsFailure(error, SAVINGS_OPERATION.MATURITY_ENRICHMENT, {
      householdId: context.householdId,
    });
    return false;
  }
}

export async function enqueueEarlyWithdrawalInboxItem(input: {
  context: SavingsWorkflowContext;
  savingId: string;
  cycleId: string;
  preview: {
    principal: number;
    accruedInterest: number;
    eligibleInterest: number;
    penaltyAmount: number;
    netReturned: number;
    penaltyStrategy: string;
    daysHeld: number;
    totalTermDays: number;
    quoteReady: boolean;
  };
  settlementAccountId: string;
  warnPenalty: boolean;
  productName: string;
}): Promise<SavingsWorkflowResult> {
  const context: SavingsEarlyWithdrawalInboxContext = {
    savingId: input.savingId,
    cycleId: input.cycleId,
    principal: input.preview.principal,
    accruedInterest: input.preview.accruedInterest,
    eligibleInterest: input.preview.eligibleInterest,
    penaltyAmount: input.preview.penaltyAmount,
    netReturned: input.preview.netReturned,
    penaltyStrategy: input.preview.penaltyStrategy,
    daysHeld: input.preview.daysHeld,
    totalTermDays: input.preview.totalTermDays,
    quoteReady: input.preview.quoteReady,
    settlementAccountId: input.settlementAccountId,
    warnPenalty: input.warnPenalty,
    cascadeDay: SAVINGS_INBOX_CONTEXT.EARLY_CASCADE_DAY,
  };
  const result = await upsertSavingsEarlyWithdrawalInboxItem({
    householdId: input.context.householdId,
    savingId: input.savingId,
    amount: input.preview.netReturned,
    currency: await getHouseholdBaseCurrency(input.context.householdId),
    title: `${input.productName} - ${SAVINGS_INBOX_CONTEXT.EARLY_WITHDRAWAL_TITLE}`,
    context,
  });
  if (!result.ok) return { status: "error", code: result.code };
  return {
    status: "success",
    id: result.inboxItemId,
    inboxItemId: result.inboxItemId,
  };
}

export async function executeSavingsMaturityWorkflow(input: {
  context: SavingsWorkflowContext;
  inboxItemId: string;
  action: string;
  cycleId: string;
  savingId: string;
  packageId?: string;
  settlementAccountId?: string;
  settlementRule?: string;
  renewalPolicyAfter?: UpdateRenewalPolicyInput["renewalPolicy"];
  renewalConfig?: UpdateRenewalPolicyInput["renewalConfig"];
}): Promise<SavingsWorkflowResult> {
  if (
    input.action === SavingsMaturityAckAction.REMIND_TOMORROW ||
    input.action === SavingsMaturityAckAction.DISMISS
  ) {
    return acknowledgeAndSucceed(input.inboxItemId, input.action);
  }

  const shouldWithdraw =
    input.action === SavingsMaturityAckAction.WITHDRAW ||
    ((input.action === SavingsMaturityAckAction.CONFIRM_CONFIGURED ||
      input.action === SavingsMaturityAckAction.CHANGE_SETTLEMENT) &&
      input.settlementRule === SettlementRule.WITHDRAW_EVERYTHING);
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
    // Existing behavior is non-atomic: money success remains success if Inbox acknowledgement fails.
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
    input.settlementRule === SettlementRule.ROLL_PRINCIPAL_ONLY
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
  return { status: "success", id: renewed.savingId, cycleId: renewed.cycleId };
}

export async function executeEarlyWithdrawalWorkflow(input: {
  context: SavingsWorkflowContext;
  inboxItemId: string;
  action: string;
  savingId: string;
  cycleId: string;
  settlementAccountId?: string;
}): Promise<SavingsWorkflowResult> {
  if (input.action !== EarlyWithdrawalAckAction.CONFIRM) {
    return acknowledgeAndSucceed(input.inboxItemId, input.action);
  }
  const confirmed = await confirmEarlyWithdrawal({
    savingId: input.savingId,
    cycleId: input.cycleId,
    settlementAccountId: input.settlementAccountId,
  });
  if (!confirmed.ok) return { status: "error", code: confirmed.code };
  // Existing behavior is non-atomic: money success remains success if Inbox acknowledgement fails.
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

async function acknowledgeAndSucceed(
  inboxItemId: string,
  action: string,
): Promise<SavingsWorkflowResult> {
  const result = await acknowledgeInboxItem({ inboxItemId, action });
  if (!result.ok) return { status: "error", code: result.code };
  return { status: "success" };
}
