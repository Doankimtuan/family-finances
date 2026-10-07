import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { getHomeHouseholdContext } from "@/modules/tenancy/application/get-home-household-context";
import type { LedgerAccount } from "../account-types";
import { AccountType, DEFAULT_CURRENCY } from "../ledger-constants";
import { LedgerRpcName } from "../ledger-shared-constants";
import {
  buildCreditCardSummary,
  mapBillingItemRow,
  mapBillingMonthRow,
  mapCreditCardSettingsRow,
  type CardBillingItem,
  type CreditCardDetail,
  type CreditCardSummary,
} from "../credit-card-types";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

type MoneyCreditCardRawInput = {
  account_id: string;
  account_name: string;
  account_type: string;
  financial_scope: string | null;
  owner_membership_id: string | null;
  owner_membership_is_active: boolean;
  credit_limit: number | string | null;
  statement_day: number | null;
  due_day: number | null;
  linked_bank_account_id: string | null;
  billing_month_id: string | null;
  card_account_id: string | null;
  billing_month: string | null;
  statement_amount: number | string | null;
  paid_amount: number | string | null;
  due_date: string | null;
  status: string | null;
};

type CreditCardAccumulator = {
  accountId: string;
  name: string;
  settings: ReturnType<typeof mapCreditCardSettingsRow> | null;
  months: ReturnType<typeof mapBillingMonthRow>[];
};

function mapMoneyCreditCardRawInputs(
  rows: MoneyCreditCardRawInput[],
): CreditCardSummary[] {
  const cards = new Map<string, CreditCardAccumulator>();
  for (const row of rows) {
    let card = cards.get(row.account_id);
    if (!card) {
      card = {
        accountId: row.account_id,
        name: row.account_name,
        settings: null,
        months: [],
      };
      cards.set(row.account_id, card);
    }

    if (
      card.settings == null &&
      row.credit_limit != null &&
      row.statement_day != null &&
      row.due_day != null
    ) {
      card.settings = mapCreditCardSettingsRow({
        account_id: row.account_id,
        credit_limit: row.credit_limit,
        statement_day: row.statement_day,
        due_day: row.due_day,
        linked_bank_account_id: row.linked_bank_account_id,
      });
    }

    if (
      row.billing_month_id == null ||
      row.card_account_id == null ||
      row.billing_month == null ||
      row.statement_amount == null ||
      row.paid_amount == null ||
      row.due_date == null ||
      row.status == null
    ) {
      continue;
    }

    card.months.push(
      mapBillingMonthRow({
        id: row.billing_month_id,
        card_account_id: row.card_account_id,
        billing_month: row.billing_month,
        statement_amount: row.statement_amount,
        paid_amount: row.paid_amount,
        due_date: row.due_date,
        status: row.status,
      }),
    );
  }

  return [...cards.values()].flatMap((card) =>
    card.settings == null
      ? []
      : [
          buildCreditCardSummary({
            accountId: card.accountId,
            name: card.name,
            settings: card.settings,
            months: card.months,
          }),
        ],
  );
}

async function loadCreditCards(): Promise<{
  currency: string;
  cards: CreditCardSummary[];
} | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [householdContext, { data, error }] = await Promise.all([
      getHomeHouseholdContext(),
      supabase.rpc(LedgerRpcName.GET_MONEY_CREDIT_CARD_RAW_INPUTS),
    ]);

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_CREDIT_CARDS, {
        householdId: gate.householdId,
      });
      return null;
    }

    return {
      currency: (
        householdContext?.baseCurrency ?? DEFAULT_CURRENCY
      ).toUpperCase(),
      cards: mapMoneyCreditCardRawInputs(
        (data ?? []) as MoneyCreditCardRawInput[],
      ),
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_CREDIT_CARDS, {
      householdId: gate.householdId,
    });
    return null;
  }
}

export const listCreditCards = cache(loadCreditCards);

export async function getCreditCardDetail(
  accountId: string,
  accountPromise: Promise<{ currency: string; account: LedgerAccount } | null>,
): Promise<{ card: CreditCardDetail } | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !accountId) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: settingsRow, error: settingsError },
      { data: monthRows, error: monthsError },
      accountResult,
    ] = await Promise.all([
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
      accountPromise,
    ]);

    const detailError = settingsError ?? monthsError;
    if (detailError) {
      logLedgerFailure(detailError, LEDGER_OPERATION.GET_CREDIT_CARD, {
        householdId: gate.householdId,
        cardAccountId: accountId,
      });
      return null;
    }

    const account = accountResult?.account;
    if (
      !account ||
      account.id !== accountId ||
      account.type !== AccountType.CREDIT_CARD ||
      account.isArchived
    ) {
      return null;
    }

    if (!settingsRow) {
      return null;
    }

    const settings = mapCreditCardSettingsRow(settingsRow);
    const months = (monthRows ?? []).map(mapBillingMonthRow);
    const summary = buildCreditCardSummary({
      accountId,
      name: account.name,
      settings,
      months,
    });

    return {
      card: {
        ...summary,
        months,
      },
    };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.GET_CREDIT_CARD, {
      householdId: gate.householdId,
      cardAccountId: accountId,
    });
    return null;
  }
}

export async function listCreditCardBillingItems(
  accountId: string,
): Promise<CardBillingItem[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !accountId) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("card_billing_items")
      .select(
        "id, billing_month_id, card_account_id, transaction_id, installment_plan_id, description, amount, fee_amount, item_type, is_paid, is_converted_to_installment",
      )
      .eq("household_id", gate.householdId)
      .eq("card_account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      logLedgerFailure(error, LEDGER_OPERATION.LIST_CREDIT_CARD_BILLING_ITEMS, {
        householdId: gate.householdId,
        cardAccountId: accountId,
      });
      return null;
    }

    return (data ?? []).map(mapBillingItemRow);
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.LIST_CREDIT_CARD_BILLING_ITEMS, {
      householdId: gate.householdId,
      cardAccountId: accountId,
    });
    return null;
  }
}
