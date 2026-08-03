import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { mapAccountRow, type RealPosition } from "../account-types";
import { applyTransactionDeltas } from "../transaction-types";
import { DEFAULT_CURRENCY } from "../ledger-constants";

/**
 * Real position = opening balances ± cleared ledger transactions (BR-01).
 */
export async function getRealPosition(): Promise<RealPosition | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: rows, error }, { data: txRows }] =
      await Promise.all([
        supabase
          .from("households")
          .select("base_currency")
          .eq("id", gate.householdId)
          .maybeSingle(),
        supabase
          .from("accounts")
          .select("id, name, type, opening_balance, is_archived")
          .eq("household_id", gate.householdId)
          .eq("is_archived", false)
          .order("created_at", { ascending: true }),
        supabase
          .from("transactions")
          .select("account_id, type, amount")
          .eq("household_id", gate.householdId)
          .eq("status", "cleared"),
      ]);

    if (error) {
      return null;
    }

    const accounts = applyTransactionDeltas(
      (rows ?? []).map(mapAccountRow),
      (txRows ?? []).map((row) => ({
        accountId: row.account_id,
        type: row.type,
        amount: row.amount,
      })),
    );
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    return {
      householdId: gate.householdId,
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      totalBalance,
      accounts,
    };
  } catch {
    return null;
  }
}
