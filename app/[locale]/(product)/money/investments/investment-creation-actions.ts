"use server";

import {
  createInitialPurchase,
  createOpeningPosition,
  type InvestmentCommandResult,
} from "@/modules/investments/application/commands/investment-commands";
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
