import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  INVESTMENT_ERROR_CODE,
  INVESTMENT_FEE_SOURCE_VALUES,
  INVESTMENT_VALIDATION_MESSAGE,
  INVESTMENT_INCOME_KIND_VALUES,
  INVESTMENT_RPC,
  INVESTMENT_VALUATION_SOURCE_VALUES,
  INVESTMENT_VISIBILITY_CONTEXT_VALUES,
  InvestmentVisibilityContext,
  InvestmentFeeSource,
  type InvestmentErrorCode,
} from "../investment-constants";
import { isPositiveQuantity } from "../decimal-quantity";
import type {
  InvestmentCommandReceipt,
  InvestmentFeeInput,
} from "../investment-types";

const quantitySchema = z.string().refine(isPositiveQuantity);
const vndSchema = z.number().finite().int().safe().nonnegative();
const positiveVndSchema = vndSchema.positive();
const dateSchema = z.iso.date();
const optionalText = z.string().trim().max(500).nullable().optional();
const feeSchema = z
  .object({
    source: z.enum(INVESTMENT_FEE_SOURCE_VALUES),
    amountVnd: positiveVndSchema.optional(),
    quantity: quantitySchema.optional(),
    feeValueVnd: positiveVndSchema,
    feeAsset: z.string().trim().max(40).nullable().optional(),
    holdingId: z.string().uuid().optional(),
    cashAccountId: z.string().uuid().optional(),
  })
  .superRefine((fee, context) => {
    const isCash = fee.source === InvestmentFeeSource.CASH;
    if (isCash && (fee.amountVnd == null || !fee.cashAccountId)) {
      context.addIssue({
        code: "custom",
        message: INVESTMENT_VALIDATION_MESSAGE.INVALID_CASH_FEE,
      });
    }
    if (!isCash && !fee.quantity) {
      context.addIssue({
        code: "custom",
        message: INVESTMENT_VALIDATION_MESSAGE.INVALID_ASSET_FEE,
      });
    }
    if (fee.source === InvestmentFeeSource.OTHER_INVESTMENT && !fee.holdingId) {
      context.addIssue({
        code: "custom",
        message: INVESTMENT_VALIDATION_MESSAGE.INVALID_FEE_HOLDING,
      });
    }
  });

export const openingPositionInputSchema = z.object({
  assetName: z.string().trim().min(1).max(160),
  assetClass: z.enum(INVESTMENT_ASSET_CLASS_VALUES),
  quantity: quantitySchema,
  asOfDate: dateSchema,
  symbol: z.string().trim().max(40).nullable().optional(),
  providerCustodian: z.string().trim().max(160).nullable().optional(),
  remainingTotalCostBasis: vndSchema.nullable().optional(),
  currentValuation: vndSchema.nullable().optional(),
  notes: optionalText,
  visibilityContext: z
    .enum(INVESTMENT_VISIBILITY_CONTEXT_VALUES)
    .default(InvestmentVisibilityContext.HOUSEHOLD),
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const initialPurchaseInputSchema = z.object({
  assetName: z.string().trim().min(1).max(160),
  assetClass: z.enum(INVESTMENT_ASSET_CLASS_VALUES),
  quantity: quantitySchema,
  unitPriceVnd: positiveVndSchema,
  cashAccountId: z.string().uuid(),
  asOfDate: dateSchema,
  symbol: z.string().trim().max(40).nullable().optional(),
  providerCustodian: z.string().trim().max(160).nullable().optional(),
  fees: z.array(feeSchema).default([]),
  notes: optionalText,
  visibilityContext: z
    .enum(INVESTMENT_VISIBILITY_CONTEXT_VALUES)
    .default(InvestmentVisibilityContext.HOUSEHOLD),
  idempotencyKey: z.string().trim().min(1).max(200),
});
export const investmentBuyInputSchema = z.object({
  holdingId: z.string().uuid(),
  cashAccountId: z.string().uuid(),
  boughtQuantity: quantitySchema,
  executedValueVnd: positiveVndSchema,
  quotedValueVnd: positiveVndSchema.nullable().optional(),
  effectiveDate: dateSchema,
  fees: z.array(feeSchema).default([]),
  notes: optionalText,
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const investmentSellInputSchema = z.object({
  holdingId: z.string().uuid(),
  cashAccountId: z.string().uuid(),
  soldQuantity: quantitySchema,
  executedValueVnd: positiveVndSchema,
  quotedValueVnd: positiveVndSchema.nullable().optional(),
  effectiveDate: dateSchema,
  fees: z.array(feeSchema).default([]),
  notes: optionalText,
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const assetConversionInputSchema = z.object({
  sourceHoldingId: z.string().uuid(),
  destinationHoldingId: z.string().uuid(),
  sourceQuantity: quantitySchema,
  destinationQuantity: quantitySchema,
  executedValueVnd: positiveVndSchema.nullable().optional(),
  quotedValueVnd: positiveVndSchema.nullable().optional(),
  effectiveDate: dateSchema,
  fees: z.array(feeSchema).default([]),
  notes: optionalText,
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const investmentIncomeInputSchema = z.object({
  holdingId: z.string().uuid(),
  cashAccountId: z.string().uuid(),
  amountVnd: positiveVndSchema,
  incomeKind: z.enum(INVESTMENT_INCOME_KIND_VALUES),
  effectiveDate: dateSchema,
  notes: optionalText,
  idempotencyKey: z.string().trim().min(1).max(200),
});

export const investmentValuationInputSchema = z.object({
  holdingId: z.string().uuid(),
  valueVnd: vndSchema,
  valuationDate: dateSchema,
  source: z.enum(INVESTMENT_VALUATION_SOURCE_VALUES),
  notes: optionalText,
  idempotencyKey: z.string().trim().min(1).max(200),
});

export type InvestmentCommandResult =
  | { ok: true; receipt: InvestmentCommandReceipt }
  | { ok: false; code: InvestmentErrorCode };

function mapReceipt(value: unknown): InvestmentCommandReceipt | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
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
      ? row.feeEffects.map((fee) => {
          const item = fee as Record<string, unknown>;
          return {
            source: String(item.source) as InvestmentFeeInput["source"],
            feeValueVnd: Number(item.feeValueVnd),
            transactionId:
              typeof item.transactionId === "string"
                ? item.transactionId
                : null,
          };
        })
      : [],
    correlationId: String(row.correlationId ?? ""),
    idempotentReplay: Boolean(row.idempotentReplay),
  };
}

async function invokeInvestmentRpc(
  rpc: (typeof INVESTMENT_RPC)[keyof typeof INVESTMENT_RPC],
  params: Record<string, unknown>,
): Promise<InvestmentCommandResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return { ok: false, code: INVESTMENT_ERROR_CODE.FORBIDDEN };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(rpc, params);
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("insufficient quantity")) {
        return { ok: false, code: INVESTMENT_ERROR_CODE.INSUFFICIENT_QUANTITY };
      }
      if (message.includes("not found")) {
        return { ok: false, code: INVESTMENT_ERROR_CODE.NOT_FOUND };
      }
      return { ok: false, code: INVESTMENT_ERROR_CODE.UNKNOWN };
    }
    const receipt = mapReceipt(data);
    return receipt
      ? { ok: true, receipt }
      : { ok: false, code: INVESTMENT_ERROR_CODE.UNKNOWN };
  } catch {
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
  return invokeInvestmentRpc(INVESTMENT_RPC.OPENING_POSITION, {
    p_asset_name: value.assetName,
    p_asset_class: value.assetClass,
    p_quantity: value.quantity,
    p_as_of_date: value.asOfDate,
    p_symbol: value.symbol ?? null,
    p_provider_custodian: value.providerCustodian ?? null,
    p_remaining_total_cost_basis: value.remainingTotalCostBasis ?? null,
    p_current_valuation: value.currentValuation ?? null,
    p_notes: value.notes ?? null,
    p_visibility_context: value.visibilityContext,
    p_idempotency_key: value.idempotencyKey,
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
    p_executed_value_vnd: value.executedValueVnd,
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
    p_executed_value_vnd: value.executedValueVnd,
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
    p_value_vnd: value.valueVnd,
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
  return invokeInvestmentRpc(INVESTMENT_RPC.INITIAL_PURCHASE, {
    p_asset_name: value.assetName,
    p_asset_class: value.assetClass,
    p_quantity: value.quantity,
    p_unit_price_vnd: value.unitPriceVnd,
    p_cash_account_id: value.cashAccountId,
    p_as_of_date: value.asOfDate,
    p_symbol: value.symbol ?? null,
    p_provider_custodian: value.providerCustodian ?? null,
    p_fees: value.fees,
    p_notes: value.notes ?? null,
    p_visibility_context: value.visibilityContext,
    p_idempotency_key: value.idempotencyKey,
  });
}
