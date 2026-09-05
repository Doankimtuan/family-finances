import { TransactionDirection } from "./ledger-constants";

type CategoryJarPolicyInput = {
  isSystem: boolean;
  kind: TransactionDirection;
  jarId: string | null | undefined;
};

/** Household expense categories bind N:1 to a jar; income categories do not. */

export function requiresJarMapping(input: {
  isSystem: boolean;
  kind: TransactionDirection;
}): boolean {
  return !input.isSystem && input.kind === TransactionDirection.EXPENSE;
}

export function isCategoryJarMapped(input: CategoryJarPolicyInput): boolean {
  if (!requiresJarMapping(input)) return true;
  return typeof input.jarId === "string" && input.jarId.length > 0;
}
