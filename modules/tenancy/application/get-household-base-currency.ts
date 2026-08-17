import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { logTenancyFailure } from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export async function getHouseholdBaseCurrency(
  householdId: string,
): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("households")
      .select("base_currency")
      .eq("id", householdId)
      .maybeSingle();

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
        householdId,
      });
    }
    return (data?.base_currency ?? DEFAULT_CURRENCY).toUpperCase();
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
      householdId,
    });
    return DEFAULT_CURRENCY;
  }
}
