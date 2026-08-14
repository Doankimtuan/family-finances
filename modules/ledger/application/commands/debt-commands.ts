import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  DebtCreationMode,
  DEBT_CREATION_MODE_VALUES,
  DEBT_DIRECTION_VALUES,
  ISO_DATE_PATTERN,
  LedgerRpcName,
} from "../ledger-constants";

export type DebtMutationResult =
  | {
      ok: true;
      debtId: string;
      transactionId?: string;
      paymentId?: string;
      amount?: number;
      remainingAmount?: number;
      completed?: boolean;
      idempotentReplay: boolean;
    }
  | { ok: false; code: ProductActionErrorCode };

export const createDebtInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    counterparty: z.string().trim().min(1).max(80),
    direction: z.enum(DEBT_DIRECTION_VALUES),
    creationMode: z.enum(DEBT_CREATION_MODE_VALUES),
    principalAmount: z.number().finite().int().positive(),
    startDate: z.string().regex(ISO_DATE_PATTERN),
    dueDate: z.string().regex(ISO_DATE_PATTERN).nullable().optional(),
    note: z.string().trim().max(200).optional(),
    accountId: z.string().uuid().nullable().optional(),
    idempotencyKey: z.string().trim().min(1).max(200),
  })
  .superRefine((value, context) => {
    if (
      value.creationMode === DebtCreationMode.MONEY_MOVED &&
      value.accountId == null
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["accountId"] });
    }
    if (value.dueDate != null && value.dueDate < value.startDate) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDate"] });
    }
  });
export type CreateDebtInput = z.infer<typeof createDebtInputSchema>;

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
    const payload = data as {
      ok?: boolean;
      debtId?: string;
      transactionId?: string | null;
      idempotentReplay?: boolean;
    } | null;
    if (error || !payload?.ok || !payload.debtId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      debtId: payload.debtId,
      transactionId: payload.transactionId ?? undefined,
      idempotentReplay: Boolean(payload.idempotentReplay),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const recordDebtPaymentInputSchema = z.object({
  debtId: z.string().uuid(),
  accountId: z.string().uuid(),
  amount: z.number().finite().int().positive(),
  effectiveDate: z.string().regex(ISO_DATE_PATTERN),
  note: z.string().trim().max(200).optional(),
  idempotencyKey: z.string().trim().min(1).max(200),
});
export type RecordDebtPaymentInput = z.infer<
  typeof recordDebtPaymentInputSchema
>;

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
    const payload = data as {
      ok?: boolean;
      debtId?: string;
      transactionId?: string;
      paymentId?: string;
      amount?: number;
      remainingAmount?: number;
      completed?: boolean;
      idempotentReplay?: boolean;
    } | null;
    if (error || !payload?.ok || !payload.debtId) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return {
      ok: true,
      debtId: payload.debtId,
      transactionId: payload.transactionId,
      paymentId: payload.paymentId,
      amount: payload.amount,
      remainingAmount: payload.remainingAmount,
      completed: payload.completed,
      idempotentReplay: Boolean(payload.idempotentReplay),
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
