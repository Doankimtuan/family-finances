import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { resolveCreationOwnership } from "@/modules/tenancy/application/resolve-creation-ownership";
import {
  INVESTMENT_ERROR_CODE,
  INVESTMENT_FEE_SOURCE_VALUES,
  INVESTMENT_LEGACY_RPC_ERROR_MARKERS,
  INVESTMENT_RPC_CONTEXT_PARAM_TO_FIELD,
  INVESTMENT_RPC,
  type InvestmentRpc,
  type InvestmentErrorCode,
} from "../investment-constants";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import type { Result } from "@/modules/shared-kernel/application/result";
import type {
  InvestmentCommandReceipt,
  InvestmentFeeInput,
} from "../investment-types";
import {
  initialPurchaseInputSchema,
  investmentBuyInputSchema,
  investmentIncomeInputSchema,
  investmentSellInputSchema,
  investmentValuationInputSchema,
  assetConversionInputSchema,
  openingPositionInputSchema,
} from "./investment-commands.schema";

export {
  assetConversionInputSchema,
  investmentBuyInputSchema,
  investmentIncomeInputSchema,
  investmentSellInputSchema,
  investmentValuationInputSchema,
  initialPurchaseInputSchema,
  openingPositionInputSchema,
} from "./investment-commands.schema";

type InvestmentCommandSuccess = {
  receipt: InvestmentCommandReceipt;
};

export type InvestmentCommandResult = Result<
  InvestmentCommandSuccess,
  InvestmentErrorCode
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const STRUCTURED_INVESTMENT_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(INVESTMENT_ERROR_CODE),
);

function isInvestmentErrorCode(value: string): value is InvestmentErrorCode {
  return STRUCTURED_INVESTMENT_ERROR_CODES.has(value);
}

function isInvestmentFeeSource(
  value: unknown,
): value is InvestmentFeeInput["source"] {
  return (
    typeof value === "string" &&
    INVESTMENT_FEE_SOURCE_VALUES.some((source) => source === value)
  );
}

/**
 * Compatibility boundary for the current investment RPCs. Structured
 * `code`, `details`, or `hint` values are preferred; text matching remains
 * here until the RPC contract exposes stable domain metadata.
 */
export function classifyLegacyInvestmentRpcError(
  error: unknown,
): InvestmentErrorCode {
  if (!isRecord(error) || typeof error.message !== "string") {
    return INVESTMENT_ERROR_CODE.UNKNOWN;
  }

  const message = error.message.toLowerCase();
  if (
    INVESTMENT_LEGACY_RPC_ERROR_MARKERS.INSUFFICIENT_QUANTITY.some((marker) =>
      message.includes(marker),
    )
  ) {
    return INVESTMENT_ERROR_CODE.INSUFFICIENT_QUANTITY;
  }
  if (
    INVESTMENT_LEGACY_RPC_ERROR_MARKERS.NOT_FOUND.some((marker) =>
      message.includes(marker),
    )
  ) {
    return INVESTMENT_ERROR_CODE.NOT_FOUND;
  }
  return INVESTMENT_ERROR_CODE.UNKNOWN;
}

export function classifyInvestmentRpcError(
  error: unknown,
): InvestmentErrorCode {
  if (isRecord(error)) {
    for (const field of [error.code, error.details, error.hint]) {
      if (typeof field === "string" && isInvestmentErrorCode(field)) {
        return field;
      }
    }
  }

  return classifyLegacyInvestmentRpcError(error);
}

function logInvestmentFailure(
  error: unknown,
  rpc: InvestmentRpc,
  householdId: string,
  params: Record<string, unknown>,
  responseInvalid = false,
): void {
  const context: Record<string, string | boolean> = { householdId };
  for (const [parameter, field] of Object.entries(
    INVESTMENT_RPC_CONTEXT_PARAM_TO_FIELD,
  )) {
    const value = params[parameter];
    if (typeof value === "string") context[field] = value;
  }
  if (responseInvalid) context.responseInvalid = true;
  logActionFailure({
    operation: rpc,
    error,
    context,
  });
}

function mapReceipt(value: unknown): InvestmentCommandReceipt | null {
  if (!isRecord(value)) return null;
  const row = value;
  if (typeof row.operationId !== "string") return null;
  return {
    operationId: row.operationId,
    holdingId: typeof row.holdingId === "string" ? row.holdingId : null,
    sourceHoldingId:
      typeof row.sourceHoldingId === "string" ? row.sourceHoldingId : null,
    destinationHoldingId:
      typeof row.destinationHoldingId === "string"
        ? row.destinationHoldingId
        : null,
    transactionIds: Array.isArray(row.transactionIds)
      ? row.transactionIds.filter((id): id is string => typeof id === "string")
      : [],
    beforeQuantity:
      row.beforeQuantity == null ? null : String(row.beforeQuantity),
    afterQuantity: row.afterQuantity == null ? null : String(row.afterQuantity),
    beforeBasis: row.beforeBasis == null ? null : Number(row.beforeBasis),
    afterBasis: row.afterBasis == null ? null : Number(row.afterBasis),
    cashDelta: Number(row.cashDelta ?? 0),
    realizedResult:
      row.realizedResult == null ? null : Number(row.realizedResult),
    feeEffects: Array.isArray(row.feeEffects)
      ? row.feeEffects.flatMap((fee) => {
          if (!isRecord(fee) || !isInvestmentFeeSource(fee.source)) {
            return [];
          }
          return [
            {
              source: fee.source,
              feeValueVnd: Number(fee.feeValueVnd),
              transactionId:
                typeof fee.transactionId === "string"
                  ? fee.transactionId
                  : null,
            },
          ];
        })
      : [],
    correlationId: String(row.correlationId ?? ""),
    idempotentReplay: Boolean(row.idempotentReplay),
  };
}

async function invokeInvestmentRpc(
  rpc: InvestmentRpc,
  params: Record<string, unknown>,
): Promise<InvestmentCommandResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return { ok: false, code: INVESTMENT_ERROR_CODE.FORBIDDEN };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(rpc, params);
    if (error) {
      const code = classifyInvestmentRpcError(error);
      if (code === INVESTMENT_ERROR_CODE.UNKNOWN) {
        logInvestmentFailure(error, rpc, gate.householdId, params);
      }
      return { ok: false, code };
    }
    const receipt = mapReceipt(data);
    if (receipt) return { ok: true, receipt };
    logInvestmentFailure(null, rpc, gate.householdId, params, true);
    return { ok: false, code: INVESTMENT_ERROR_CODE.UNKNOWN };
  } catch (error) {
    logInvestmentFailure(error, rpc, gate.householdId, params);
    return { ok: false, code: INVESTMENT_ERROR_CODE.UNKNOWN };
  }
}

export async function createOpeningPosition(
  raw: z.input<typeof openingPositionInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = openingPositionInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return { ok: false, code: INVESTMENT_ERROR_CODE.FORBIDDEN };
  const ownership = await resolveCreationOwnership(
    gate.householdId,
    value.financialScope,
  );
  if (!ownership) return { ok: false, code: INVESTMENT_ERROR_CODE.FORBIDDEN };
  return invokeInvestmentRpc(INVESTMENT_RPC.OPENING_POSITION, {
    p_asset_name: value.assetName,
    p_asset_class: value.assetClass,
    p_instrument_id: value.instrumentId ?? null,
    p_quantity: value.quantity,
    p_as_of_date: value.asOfDate,
    p_symbol: value.symbol ?? null,
    p_provider_custodian: value.providerCustodian ?? null,
    p_remaining_total_cost_basis: value.remainingTotalCostBasis ?? null,
    p_current_valuation: value.currentValuation ?? null,
    p_notes: value.notes ?? null,
    p_visibility_context: value.visibilityContext,
    p_idempotency_key: value.idempotencyKey,
    p_financial_scope: ownership.financialScope,
  });
}

export async function recordInvestmentBuy(
  raw: z.input<typeof investmentBuyInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = investmentBuyInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  return invokeInvestmentRpc(INVESTMENT_RPC.BUY, {
    p_holding_id: value.holdingId,
    p_cash_account_id: value.cashAccountId,
    p_bought_quantity: value.boughtQuantity,
    p_unit_price_vnd: value.unitPriceVnd ?? null,
    p_total_value_vnd: value.totalValueVnd ?? null,
    p_quoted_value_vnd: value.quotedValueVnd ?? null,
    p_effective_date: value.effectiveDate,
    p_fees: value.fees,
    p_notes: value.notes ?? null,
    p_idempotency_key: value.idempotencyKey,
  });
}

export async function recordInvestmentSell(
  raw: z.input<typeof investmentSellInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = investmentSellInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  return invokeInvestmentRpc(INVESTMENT_RPC.SELL, {
    p_holding_id: value.holdingId,
    p_cash_account_id: value.cashAccountId,
    p_sold_quantity: value.soldQuantity,
    p_unit_price_vnd: value.unitPriceVnd ?? null,
    p_total_value_vnd: value.totalValueVnd ?? null,
    p_quoted_value_vnd: value.quotedValueVnd ?? null,
    p_effective_date: value.effectiveDate,
    p_fees: value.fees,
    p_notes: value.notes ?? null,
    p_idempotency_key: value.idempotencyKey,
  });
}

export async function recordAssetConversion(
  raw: z.input<typeof assetConversionInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = assetConversionInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  return invokeInvestmentRpc(INVESTMENT_RPC.CONVERSION, {
    p_source_holding_id: value.sourceHoldingId,
    p_destination_holding_id: value.destinationHoldingId,
    p_source_quantity: value.sourceQuantity,
    p_destination_quantity: value.destinationQuantity,
    p_executed_value_vnd: value.executedValueVnd ?? null,
    p_quoted_value_vnd: value.quotedValueVnd ?? null,
    p_effective_date: value.effectiveDate,
    p_fees: value.fees,
    p_notes: value.notes ?? null,
    p_idempotency_key: value.idempotencyKey,
  });
}

export async function recordInvestmentIncome(
  raw: z.input<typeof investmentIncomeInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = investmentIncomeInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  return invokeInvestmentRpc(INVESTMENT_RPC.INCOME, {
    p_holding_id: value.holdingId,
    p_cash_account_id: value.cashAccountId,
    p_amount_vnd: value.amountVnd,
    p_income_kind: value.incomeKind,
    p_effective_date: value.effectiveDate,
    p_notes: value.notes ?? null,
    p_idempotency_key: value.idempotencyKey,
  });
}

export async function recordInvestmentValuation(
  raw: z.input<typeof investmentValuationInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = investmentValuationInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  return invokeInvestmentRpc(INVESTMENT_RPC.VALUATION, {
    p_holding_id: value.holdingId,
    p_unit_price_vnd: value.unitPriceVnd ?? null,
    p_total_value_vnd: value.totalValueVnd ?? null,
    p_valuation_date: value.valuationDate,
    p_source: value.source,
    p_notes: value.notes ?? null,
    p_idempotency_key: value.idempotencyKey,
  });
}

export async function createInitialPurchase(
  raw: z.input<typeof initialPurchaseInputSchema>,
): Promise<InvestmentCommandResult> {
  const parsed = initialPurchaseInputSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, code: INVESTMENT_ERROR_CODE.INVALID };
  const value = parsed.data;
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return { ok: false, code: INVESTMENT_ERROR_CODE.FORBIDDEN };
  const ownership = await resolveCreationOwnership(
    gate.householdId,
    value.financialScope,
  );
  if (!ownership) return { ok: false, code: INVESTMENT_ERROR_CODE.FORBIDDEN };
  return invokeInvestmentRpc(INVESTMENT_RPC.INITIAL_PURCHASE, {
    p_asset_name: value.assetName,
    p_asset_class: value.assetClass,
    p_instrument_id: value.instrumentId ?? null,
    p_quantity: value.quantity,
    p_unit_price_vnd: value.unitPriceVnd ?? null,
    p_total_value_vnd: value.totalValueVnd ?? null,
    p_cash_account_id: value.cashAccountId,
    p_as_of_date: value.asOfDate,
    p_symbol: value.symbol ?? null,
    p_provider_custodian: value.providerCustodian ?? null,
    p_fees: value.fees,
    p_notes: value.notes ?? null,
    p_visibility_context: value.visibilityContext,
    p_idempotency_key: value.idempotencyKey,
    p_financial_scope: ownership.financialScope,
  });
}
