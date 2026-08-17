"use server";

import {
  createOpeningPosition,
  createInitialPurchase,
  recordAssetConversion,
  recordInvestmentBuy,
  recordInvestmentIncome,
  recordInvestmentSell,
  recordInvestmentValuation,
  type InvestmentCommandResult,
} from "@/modules/investments/application";
import { revalidateInvestmentViews } from "@/app/mutation-revalidation";

function revalidateInvestmentResult(result: InvestmentCommandResult) {
  if (result.ok) revalidateInvestmentViews();
  return result;
}

export async function createOpeningPositionAction(
  input: Parameters<typeof createOpeningPosition>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await createOpeningPosition(input));
}
export async function createInitialPurchaseAction(
  input: Parameters<typeof createInitialPurchase>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await createInitialPurchase(input));
}

export async function recordInvestmentBuyAction(
  input: Parameters<typeof recordInvestmentBuy>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await recordInvestmentBuy(input));
}

export async function recordInvestmentSellAction(
  input: Parameters<typeof recordInvestmentSell>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await recordInvestmentSell(input));
}

export async function recordAssetConversionAction(
  input: Parameters<typeof recordAssetConversion>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await recordAssetConversion(input));
}

export async function recordInvestmentIncomeAction(
  input: Parameters<typeof recordInvestmentIncome>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await recordInvestmentIncome(input));
}

export async function recordInvestmentValuationAction(
  input: Parameters<typeof recordInvestmentValuation>[0],
): Promise<InvestmentCommandResult> {
  return revalidateInvestmentResult(await recordInvestmentValuation(input));
}
