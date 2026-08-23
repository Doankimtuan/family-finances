import { listAccounts } from "@/modules/ledger/application";
import { isEligibleSavingsAccountType } from "../savings-domain-rules";

/** The picker view-model mirrors the server Savings liquid-account allowlist. */
export async function listSavingsEligibleAccounts() {
  const result = await listAccounts();
  if (!result) return null;

  return {
    ...result,
    accounts: result.accounts.filter(
      (account) =>
        isEligibleSavingsAccountType(account.type) && account.canMutate,
    ),
  };
}
