import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  mapLiabilityRow,
  mapSavingsRow,
  mapInstallmentRow,
  type Liability,
  type SavingsProduct,
  type InstallmentPlan,
} from "../money-product-types";

export async function listLiabilities(): Promise<Liability[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(
        "id, name, creditor, principal_amount, remaining_amount, currency, due_day, note, is_archived",
      )
      .eq("household_id", gate.householdId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) return null;
    return (data ?? []).map(mapLiabilityRow);
  } catch {
    return null;
  }
}

export async function getLiability(
  liabilityId: string,
): Promise<Liability | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("liabilities")
      .select(
        "id, name, creditor, principal_amount, remaining_amount, currency, due_day, note, is_archived",
      )
      .eq("household_id", gate.householdId)
      .eq("id", liabilityId)
      .maybeSingle();

    if (error || !data) return null;
    return mapLiabilityRow(data);
  } catch {
    return null;
  }
}

export async function listSavingsProducts(): Promise<SavingsProduct[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings_accounts")
      .select(
        "id, name, principal_amount, currency, maturity_date, status, note",
      )
      .eq("household_id", gate.householdId)
      .neq("status", "closed")
      .order("maturity_date", { ascending: true });

    if (error) return null;
    return (data ?? []).map(mapSavingsRow);
  } catch {
    return null;
  }
}

export async function getSavingsProduct(
  savingsId: string,
): Promise<SavingsProduct | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("savings_accounts")
      .select(
        "id, name, principal_amount, currency, maturity_date, status, note",
      )
      .eq("household_id", gate.householdId)
      .eq("id", savingsId)
      .maybeSingle();

    if (error || !data) return null;
    return mapSavingsRow(data);
  } catch {
    return null;
  }
}

export async function listInstallmentPlans(): Promise<
  InstallmentPlan[] | null
> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("installment_plans")
      .select(
        "id, name, card_label, total_amount, installment_amount, currency, num_installments, paid_installments, status, note",
      )
      .eq("household_id", gate.householdId)
      .order("created_at", { ascending: false });

    if (error) return null;
    return (data ?? []).map(mapInstallmentRow);
  } catch {
    return null;
  }
}

export async function getInstallmentPlan(
  planId: string,
): Promise<InstallmentPlan | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("installment_plans")
      .select(
        "id, name, card_label, total_amount, installment_amount, currency, num_installments, paid_installments, status, note",
      )
      .eq("household_id", gate.householdId)
      .eq("id", planId)
      .maybeSingle();

    if (error || !data) return null;
    return mapInstallmentRow(data);
  } catch {
    return null;
  }
}
