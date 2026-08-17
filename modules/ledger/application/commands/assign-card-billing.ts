import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  CardBillingItemType,
  CardBillingMonthStatus,
  TransactionDirection,
} from "../ledger-constants";
import {
  resolveBillingDueDate,
  resolveBillingMonthKey,
} from "../credit-card-billing";
import { computeOutstanding } from "../credit-card-billing";
import { mapBillingMonthRow } from "../credit-card-types";
import { LEDGER_OPERATION, logLedgerFailure } from "../ledger-error";

type AssignMode = "expense" | "cashback";

/**
 * After a cleared CC transaction: ensure billing month + item, adjust statement.
 * Cashback credits the latest unpaid cycle (legacy behavior).
 */
export async function assignCardBillingForTransaction(input: {
  householdId: string;
  cardAccountId: string;
  transactionId: string;
  amount: number;
  transactionDate: string;
  note: string | null;
  mode: AssignMode;
  statementDay: number;
  dueDay: number;
}): Promise<{ ok: true } | { ok: false }> {
  try {
    const supabase = await createSupabaseServerClient();
    const signedAmount =
      input.mode === "cashback"
        ? -Math.abs(input.amount)
        : Math.abs(input.amount);

    let billingMonthKey = resolveBillingMonthKey(
      input.transactionDate,
      input.statementDay,
    );

    if (input.mode === "cashback") {
      const { data: unpaid, error: unpaidError } = await supabase
        .from("card_billing_months")
        .select(
          "id, card_account_id, billing_month, statement_amount, paid_amount, due_date, status",
        )
        .eq("household_id", input.householdId)
        .eq("card_account_id", input.cardAccountId)
        .neq("status", CardBillingMonthStatus.SETTLED)
        .order("billing_month", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (unpaidError) {
        logLedgerFailure(unpaidError, LEDGER_OPERATION.ASSIGN_CARD_BILLING, {
          householdId: input.householdId,
          cardAccountId: input.cardAccountId,
          transactionId: input.transactionId,
        });
        return { ok: false };
      }

      if (unpaid?.billing_month) {
        billingMonthKey = unpaid.billing_month.slice(0, 10);
      }
    }

    const dueDate = resolveBillingDueDate(
      billingMonthKey,
      input.statementDay,
      input.dueDay,
    );

    const { data: existingMonth, error: existingMonthError } = await supabase
      .from("card_billing_months")
      .select(
        "id, card_account_id, billing_month, statement_amount, paid_amount, due_date, status",
      )
      .eq("card_account_id", input.cardAccountId)
      .eq("billing_month", billingMonthKey)
      .maybeSingle();

    if (existingMonthError) {
      logLedgerFailure(
        existingMonthError,
        LEDGER_OPERATION.ASSIGN_CARD_BILLING,
        {
          householdId: input.householdId,
          cardAccountId: input.cardAccountId,
          transactionId: input.transactionId,
        },
      );
      return { ok: false };
    }

    let monthId = existingMonth?.id as string | undefined;
    let statementAmount = existingMonth
      ? Number(existingMonth.statement_amount)
      : 0;
    const paidAmount = existingMonth ? Number(existingMonth.paid_amount) : 0;

    statementAmount = Math.max(0, statementAmount + signedAmount);
    const status =
      statementAmount <= 0 || paidAmount >= statementAmount
        ? CardBillingMonthStatus.SETTLED
        : paidAmount > 0
          ? CardBillingMonthStatus.PARTIAL
          : CardBillingMonthStatus.OPEN;

    if (monthId) {
      const { error } = await supabase
        .from("card_billing_months")
        .update({
          statement_amount: statementAmount,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", monthId);
      if (error) {
        logLedgerFailure(error, LEDGER_OPERATION.ASSIGN_CARD_BILLING, {
          householdId: input.householdId,
          cardAccountId: input.cardAccountId,
          transactionId: input.transactionId,
        });
        return { ok: false };
      }
    } else {
      const { data: created, error } = await supabase
        .from("card_billing_months")
        .insert({
          household_id: input.householdId,
          card_account_id: input.cardAccountId,
          billing_month: billingMonthKey,
          statement_amount: statementAmount,
          paid_amount: 0,
          due_date: dueDate,
          status:
            statementAmount <= 0
              ? CardBillingMonthStatus.SETTLED
              : CardBillingMonthStatus.OPEN,
        })
        .select("id")
        .single();
      if (error) {
        logLedgerFailure(error, LEDGER_OPERATION.ASSIGN_CARD_BILLING, {
          householdId: input.householdId,
          cardAccountId: input.cardAccountId,
          transactionId: input.transactionId,
        });
        return { ok: false };
      }
      if (!created?.id) {
        logLedgerFailure(null, LEDGER_OPERATION.ASSIGN_CARD_BILLING, {
          householdId: input.householdId,
          cardAccountId: input.cardAccountId,
          transactionId: input.transactionId,
          responseInvalid: true,
        });
        return { ok: false };
      }
      monthId = created.id;
    }

    const { error: itemError } = await supabase
      .from("card_billing_items")
      .insert({
        household_id: input.householdId,
        billing_month_id: monthId,
        card_account_id: input.cardAccountId,
        transaction_id: input.transactionId,
        description: input.note,
        amount: signedAmount,
        fee_amount: 0,
        item_type: CardBillingItemType.STANDARD,
        is_paid: false,
        is_converted_to_installment: false,
      });

    if (itemError) {
      logLedgerFailure(itemError, LEDGER_OPERATION.ASSIGN_CARD_BILLING, {
        householdId: input.householdId,
        cardAccountId: input.cardAccountId,
        transactionId: input.transactionId,
      });
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    logLedgerFailure(error, LEDGER_OPERATION.ASSIGN_CARD_BILLING, {
      householdId: input.householdId,
      cardAccountId: input.cardAccountId,
      transactionId: input.transactionId,
    });
    return { ok: false };
  }
}

export async function loadCardOutstandingAndLimit(input: {
  householdId: string;
  cardAccountId: string;
}): Promise<{
  creditLimit: number;
  outstanding: number;
  statementDay: number;
  dueDay: number;
} | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, { data: months }] = await Promise.all([
    supabase
      .from("credit_card_settings")
      .select("credit_limit, statement_day, due_day")
      .eq("household_id", input.householdId)
      .eq("account_id", input.cardAccountId)
      .maybeSingle(),
    supabase
      .from("card_billing_months")
      .select(
        "id, card_account_id, billing_month, statement_amount, paid_amount, due_date, status",
      )
      .eq("household_id", input.householdId)
      .eq("card_account_id", input.cardAccountId),
  ]);

  if (!settings) return null;
  const mapped = (months ?? []).map(mapBillingMonthRow);
  return {
    creditLimit: Number(settings.credit_limit),
    outstanding: computeOutstanding(mapped),
    statementDay: settings.statement_day,
    dueDay: settings.due_day,
  };
}

export { TransactionDirection };
