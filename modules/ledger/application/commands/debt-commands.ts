import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { resolveCreationOwnership } from "@/modules/tenancy/application/resolve-creation-ownership";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LedgerRelation, LedgerRpcName } from "../ledger-constants";
import {
  createDebtInputSchema,
  recordDebtPaymentInputSchema,
  updateDebtInputSchema,
  type CreateDebtInput,
  type RecordDebtPaymentInput,
  type UpdateDebtInput,
} from "./debt.schemas";
import { DebtCreationMode, isDebtMovementAccountType } from "../debt-constants";

export {
  createDebtInputSchema,
  recordDebtPaymentInputSchema,
  updateDebtInputSchema,
} from "./debt.schemas";
export type {
  CreateDebtInput,
  RecordDebtPaymentInput,
  UpdateDebtInput,
} from "./debt.schemas";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  classifyDebtRpcError,
  LEDGER_OPERATION,
  logLedgerFailure,
} from "../ledger-error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDebtSuccessPayload(
  value: unknown,
): value is Record<string, unknown> & { ok: true; debtId: string } {
  return (
    isRecord(value) && value.ok === true && typeof value.debtId === "string"
  );
}

async function hasEligibleMovementAccount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  householdId: string,
  accountId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("accounts")
    .select("type")
    .eq("id", accountId)
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .maybeSingle();

  return !error && data != null && isDebtMovementAccountType(data.type);
}

export type DebtMutationResult = Result<
  {
    debtId: string;
    transactionId?: string;
    paymentId?: string;
    amount?: number;
    remainingAmount?: number;
    completed?: boolean;
    idempotentReplay: boolean;
  },
  ProductActionErrorCode
>;

export async function createDebt(
  raw: CreateDebtInput,
): Promise<DebtMutationResult> {
  const parsed = createDebtInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }
  const ownership = await resolveCreationOwnership(
    gate.householdId,
    parsed.data.financialScope,
  );
  if (!ownership) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP };
  }
  try {
    const supabase = await createSupabaseServerClient();
    if (
      parsed.data.creationMode === DebtCreationMode.MONEY_MOVED &&
      parsed.data.accountId != null &&
      !(await hasEligibleMovementAccount(
        supabase,
        gate.householdId,
        parsed.data.accountId,
      ))
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const { data, error } = await supabase.rpc(LedgerRpcName.CREATE_DEBT, {
      p_name: parsed.data.counterparty,
      p_counterparty: parsed.data.counterparty,
      p_direction: parsed.data.direction,
      p_creation_mode: parsed.data.creationMode,
      p_principal_amount: parsed.data.principalAmount,
      p_start_date: parsed.data.startDate,
      p_due_date: parsed.data.dueDate ?? null,
      p_note: parsed.data.note ?? null,
      p_account_id: parsed.data.accountId ?? null,
      p_idempotency_key: parsed.data.idempotencyKey,
      p_financial_scope: ownership.financialScope,
    });
    if (error) {
      const code = classifyDebtRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.CREATE_DEBT, {
          householdId: gate.householdId,
        });
      }
      return { ok: false, code };
    }
    if (!isDebtSuccessPayload(data)) {
      logLedgerFailure(null, LEDGER_OPERATION.CREATE_DEBT, {
        householdId: gate.householdId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      debtId: data.debtId,
      transactionId:
        typeof data.transactionId === "string" ? data.transactionId : undefined,
      idempotentReplay: Boolean(data.idempotentReplay),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.CREATE_DEBT, {
      householdId: gate.householdId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function updateDebt(
  raw: UpdateDebtInput,
): Promise<DebtMutationResult> {
  const parsed = updateDebtInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: current, error: currentError } = await supabase
      .from(LedgerRelation.LIABILITIES)
      .select("start_date")
      .eq("id", parsed.data.debtId)
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .maybeSingle();
    if (currentError) {
      logLedgerFailure(currentError, LEDGER_OPERATION.UPDATE_DEBT_METADATA, {
        householdId: gate.householdId,
        debtId: parsed.data.debtId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!current) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    if (
      parsed.data.dueDate != null &&
      current.start_date != null &&
      parsed.data.dueDate < current.start_date
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const { data, error } = await supabase
      .from(LedgerRelation.LIABILITIES)
      .update({
        name: parsed.data.counterparty,
        creditor: parsed.data.counterparty,
        due_date: parsed.data.dueDate ?? null,
        note: parsed.data.note?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.debtId)
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .select("id")
      .maybeSingle();

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.UPDATE_DEBT_METADATA, {
        householdId: gate.householdId,
        debtId: parsed.data.debtId,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    if (!data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    return {
      ok: true,
      debtId: parsed.data.debtId,
      idempotentReplay: false,
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.UPDATE_DEBT_METADATA, {
      householdId: gate.householdId,
      debtId: parsed.data.debtId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export async function recordDebtPayment(
  raw: RecordDebtPaymentInput,
): Promise<DebtMutationResult> {
  const parsed = recordDebtPaymentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }
  try {
    const supabase = await createSupabaseServerClient();
    if (
      !(await hasEligibleMovementAccount(
        supabase,
        gate.householdId,
        parsed.data.accountId,
      ))
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const { data, error } = await supabase.rpc(
      LedgerRpcName.RECORD_DEBT_PAYMENT,
      {
        p_debt_id: parsed.data.debtId,
        p_account_id: parsed.data.accountId,
        p_amount: parsed.data.amount,
        p_effective_date: parsed.data.effectiveDate,
        p_note: parsed.data.note ?? null,
        p_idempotency_key: parsed.data.idempotencyKey,
      },
    );
    if (error) {
      const code = classifyDebtRpcError(error);
      if (code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN) {
        logLedgerFailure(error, LEDGER_OPERATION.RECORD_DEBT_PAYMENT, {
          householdId: gate.householdId,
          debtId: parsed.data.debtId,
          accountId: parsed.data.accountId,
        });
      }
      return { ok: false, code };
    }
    if (!isDebtSuccessPayload(data)) {
      logLedgerFailure(null, LEDGER_OPERATION.RECORD_DEBT_PAYMENT, {
        householdId: gate.householdId,
        debtId: parsed.data.debtId,
        accountId: parsed.data.accountId,
        responseInvalid: true,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      debtId: data.debtId,
      transactionId:
        typeof data.transactionId === "string" ? data.transactionId : undefined,
      paymentId:
        typeof data.paymentId === "string" ? data.paymentId : undefined,
      amount: typeof data.amount === "number" ? data.amount : undefined,
      remainingAmount:
        typeof data.remainingAmount === "number"
          ? data.remainingAmount
          : undefined,
      completed:
        typeof data.completed === "boolean" ? data.completed : undefined,
      idempotentReplay: Boolean(data.idempotentReplay),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.RECORD_DEBT_PAYMENT, {
      householdId: gate.householdId,
      debtId: parsed.data.debtId,
      accountId: parsed.data.accountId,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
