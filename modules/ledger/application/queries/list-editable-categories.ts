import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { isCategoryIconKey, type CategoryIconKey } from "../icon-constants";
import { LedgerRelation } from "../ledger-constants";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

export type EditableCategory = {
  id: string;
  name: string;
  iconKey: CategoryIconKey | null;
};

export async function listEditableCategories(): Promise<
  EditableCategory[] | null
> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(LedgerRelation.CATEGORIES)
      .select("id, name, icon_key")
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      iconKey:
        row.icon_key && isCategoryIconKey(row.icon_key) ? row.icon_key : null,
    }));
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_EDITABLE_CATEGORIES, {
      householdId: gate.householdId,
    });
    return null;
  }
}
