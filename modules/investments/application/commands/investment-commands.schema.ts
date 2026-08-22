import { z } from "zod";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  INVESTMENT_FEE_SOURCE_VALUES,
  INVESTMENT_INCOME_KIND_VALUES,
  INVESTMENT_VALIDATION_MESSAGE,
  INVESTMENT_VALUATION_SOURCE_VALUES,
  INVESTMENT_VISIBILITY_CONTEXT_VALUES,
  InvestmentFeeSource,
  InvestmentVisibilityContext,
  InvestmentAssetClass,
} from "../investment-constants";
import { isPositiveQuantity } from "../decimal-quantity";
import {
  FINANCIAL_SCOPE,
  FINANCIAL_SCOPE_VALUES,
} from "@/modules/shared-kernel/application/financial-scope";

export const quantitySchema = z.string().refine(isPositiveQuantity);
export const vndSchema = z.number().finite().int().safe().nonnegative();
export const positiveVndSchema = vndSchema.positive();
export const unitPriceVndSchema = vndSchema;
export const positiveUnitPriceVndSchema = unitPriceVndSchema.positive();
export const dateSchema = z.iso.date();
export const optionalText = z.string().trim().max(500).nullable().optional();
export const feeSchema = z
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
  financialScope: z
    .enum(FINANCIAL_SCOPE_VALUES)
    .default(FINANCIAL_SCOPE.HOUSEHOLD),
  assetName: z.string().trim().min(1).max(160),
  assetClass: z.enum(INVESTMENT_ASSET_CLASS_VALUES),
  instrumentId: z.string().uuid().nullable().optional(),
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

export const initialPurchaseInputSchema = z
  .object({
    financialScope: z
      .enum(FINANCIAL_SCOPE_VALUES)
      .default(FINANCIAL_SCOPE.HOUSEHOLD),
    assetName: z.string().trim().min(1).max(160),
    assetClass: z.enum(INVESTMENT_ASSET_CLASS_VALUES),
    instrumentId: z.string().uuid().nullable().optional(),
    quantity: quantitySchema,
    unitPriceVnd: positiveVndSchema.nullable().optional(),
    totalValueVnd: positiveVndSchema.nullable().optional(),
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
  })
  .superRefine((value, context) => {
    if (value.assetClass === InvestmentAssetClass.BOND) {
      if (value.totalValueVnd == null || value.unitPriceVnd != null) {
        context.addIssue({
          code: "custom",
          path: ["totalValueVnd"],
          message: "Required",
        });
      }
      return;
    }
    if (value.unitPriceVnd == null || value.totalValueVnd != null) {
      context.addIssue({
        code: "custom",
        path: ["unitPriceVnd"],
        message: "Required",
      });
    }
  });

export type OpeningPositionInput = z.input<typeof openingPositionInputSchema>;
export type InitialPurchaseInput = z.input<typeof initialPurchaseInputSchema>;

export const investmentBuyInputSchema = z.object({
  holdingId: z.string().uuid(),
  cashAccountId: z.string().uuid(),
  boughtQuantity: quantitySchema,
  unitPriceVnd: positiveUnitPriceVndSchema.nullable().optional(),
  totalValueVnd: positiveVndSchema.nullable().optional(),
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
  unitPriceVnd: positiveUnitPriceVndSchema.nullable().optional(),
  totalValueVnd: positiveVndSchema.nullable().optional(),
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
  unitPriceVnd: unitPriceVndSchema.nullable().optional(),
  totalValueVnd: vndSchema.nullable().optional(),
  valuationDate: dateSchema,
  source: z.enum(INVESTMENT_VALUATION_SOURCE_VALUES),
  notes: optionalText,
  idempotencyKey: z.string().trim().min(1).max(200),
});
