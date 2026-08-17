import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LedgerRpcName } from "../ledger-constants";
import {
  createDebtInputSchema,
  recordDebtPaymentInputSchema,
  type CreateDebtInput,
  type RecordDebtPaymentInput,
} from "./debt.schemas";

export {
  createDebtInputSchema,
  recordDebtPaymentInputSchema,
} from "./debt.schemas";
export type { CreateDebtInput, RecordDebtPaymentInput } from "./debt.schemas";
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
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(LedgerRpcName.CREATE_DEBT, {
      p_name: parsed.data.name,
      p_counterparty: parsed.data.counterparty,
      p_direction: parsed.data.direction,
      p_creation_mode: parsed.data.creationMode,
      p_principal_amount: parsed.data.principalAmount,
      p_start_date: parsed.data.startDate,
      p_due_date: parsed.data.dueDate ?? null,
      p_note: parsed.data.note ?? null,
      p_account_id: parsed.data.accountId ?? null,
      p_idempotency_key: parsed.data.idempotencyKey,
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
