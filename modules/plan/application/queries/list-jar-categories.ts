import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";

export type JarCategoryOption = {
  id: string;
  name: string;
  kind: (typeof TransactionDirection)[keyof typeof TransactionDirection];
  jarId: string;
};

/** Household-owned categories only; system templates are not writable mappings. */
export async function listJarCategories(): Promise<JarCategoryOption[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, kind, jar_id")
      .eq("household_id", gate.householdId)
      .eq("is_system", false)
      .eq("is_active", true)
      .not("jar_id", "is", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) return null;

    return (data ?? []).flatMap((row) => {
      if (!row.jar_id) return [];
      return [
        {
          id: row.id,
          name: row.name,
          kind:
            row.kind === TransactionDirection.INCOME
              ? TransactionDirection.INCOME
              : TransactionDirection.EXPENSE,
          jarId: row.jar_id,
        },
      ];
    });
  } catch {
    return null;
  }
}
