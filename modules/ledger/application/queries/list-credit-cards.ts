import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { AccountType, DEFAULT_CURRENCY } from "../ledger-constants";
import {
  buildCreditCardSummary,
  mapBillingItemRow,
  mapBillingMonthRow,
  mapCreditCardSettingsRow,
  type CreditCardDetail,
  type CreditCardSummary,
} from "../credit-card-types";

export async function listCreditCards(): Promise<{
  currency: string;
  cards: CreditCardSummary[];
} | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: household }, { data: accounts, error }] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id, name, type")
        .eq("household_id", gate.householdId)
        .eq("is_archived", false)
        .eq("type", AccountType.CREDIT_CARD)
        .order("created_at", { ascending: true }),
    ]);

    if (error) {
      return null;
    }

    const cardIds = (accounts ?? []).map((a) => a.id);
    if (cardIds.length === 0) {
      return {
        currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
        cards: [],
      };
    }

    const [{ data: settingsRows }, { data: monthRows }] = await Promise.all([
      supabase
        .from("credit_card_settings")
        .select(
          "account_id, credit_limit, statement_day, due_day, linked_bank_account_id",
        )
        .eq("household_id", gate.householdId)
        .in("account_id", cardIds),
      supabase
        .from("card_billing_months")
        .select(
          "id, card_account_id, billing_month, statement_amount, paid_amount, due_date, status",
        )
        .eq("household_id", gate.householdId)
        .in("card_account_id", cardIds),
    ]);

    const settingsByAccount = new Map(
      (settingsRows ?? []).map((row) => [
        row.account_id,
        mapCreditCardSettingsRow(row),
      ]),
    );
    const monthsByAccount = new Map<
      string,
      ReturnType<typeof mapBillingMonthRow>[]
    >();
    for (const row of monthRows ?? []) {
      const mapped = mapBillingMonthRow(row);
      const list = monthsByAccount.get(mapped.cardAccountId) ?? [];
      list.push(mapped);
      monthsByAccount.set(mapped.cardAccountId, list);
    }

    const cards: CreditCardSummary[] = [];
    for (const account of accounts ?? []) {
      const settings = settingsByAccount.get(account.id);
      if (!settings) continue;
      cards.push(
        buildCreditCardSummary({
          accountId: account.id,
          name: account.name,
          settings,
          months: monthsByAccount.get(account.id) ?? [],
        }),
      );
    }

    return {
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      cards,
    };
  } catch {
    return null;
  }
}

export async function getCreditCardDetail(
  accountId: string,
): Promise<{ currency: string; card: CreditCardDetail } | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !accountId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: household },
      { data: account },
      { data: settingsRow },
      { data: monthRows },
      { data: itemRows },
    ] = await Promise.all([
      supabase
        .from("households")
        .select("base_currency")
        .eq("id", gate.householdId)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id, name, type, is_archived")
        .eq("household_id", gate.householdId)
        .eq("id", accountId)
        .eq("type", AccountType.CREDIT_CARD)
        .maybeSingle(),
      supabase
        .from("credit_card_settings")
        .select(
          "account_id, credit_limit, statement_day, due_day, linked_bank_account_id",
        )
        .eq("household_id", gate.householdId)
        .eq("account_id", accountId)
        .maybeSingle(),
      supabase
        .from("card_billing_months")
        .select(
          "id, card_account_id, billing_month, statement_amount, paid_amount, due_date, status",
        )
        .eq("household_id", gate.householdId)
        .eq("card_account_id", accountId)
        .order("billing_month", { ascending: false })
        .limit(12),
      supabase
        .from("card_billing_items")
        .select(
          "id, billing_month_id, card_account_id, transaction_id, installment_plan_id, description, amount, fee_amount, item_type, is_paid, is_converted_to_installment",
        )
        .eq("household_id", gate.householdId)
        .eq("card_account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    if (!account || account.is_archived || !settingsRow) {
      return null;
    }

    const settings = mapCreditCardSettingsRow(settingsRow);
    const months = (monthRows ?? []).map(mapBillingMonthRow);
    const summary = buildCreditCardSummary({
      accountId: account.id,
      name: account.name,
      settings,
      months,
    });

    return {
      currency: (household?.base_currency ?? DEFAULT_CURRENCY).toUpperCase(),
      card: {
        ...summary,
        months,
        items: (itemRows ?? []).map(mapBillingItemRow),
      },
    };
  } catch {
    return null;
  }
}
