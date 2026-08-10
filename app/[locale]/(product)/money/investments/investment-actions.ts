"use server";

import {
  createOpeningPosition,
  recordAssetConversion,
  recordInvestmentBuy,
  recordInvestmentIncome,
  recordInvestmentSell,
  recordInvestmentValuation,
  type InvestmentCommandResult,
} from "@/modules/investments/application";

export async function createOpeningPositionAction(
  input: Parameters<typeof createOpeningPosition>[0],
): Promise<InvestmentCommandResult> {
  return createOpeningPosition(input);
}

export async function recordInvestmentBuyAction(
  input: Parameters<typeof recordInvestmentBuy>[0],
): Promise<InvestmentCommandResult> {
  return recordInvestmentBuy(input);
}

export async function recordInvestmentSellAction(
  input: Parameters<typeof recordInvestmentSell>[0],
): Promise<InvestmentCommandResult> {
  return recordInvestmentSell(input);
}

export async function recordAssetConversionAction(
  input: Parameters<typeof recordAssetConversion>[0],
): Promise<InvestmentCommandResult> {
  return recordAssetConversion(input);
}

export async function recordInvestmentIncomeAction(
  input: Parameters<typeof recordInvestmentIncome>[0],
): Promise<InvestmentCommandResult> {
  return recordInvestmentIncome(input);
}

export async function recordInvestmentValuationAction(
  input: Parameters<typeof recordInvestmentValuation>[0],
): Promise<InvestmentCommandResult> {
  return recordInvestmentValuation(input);
}
