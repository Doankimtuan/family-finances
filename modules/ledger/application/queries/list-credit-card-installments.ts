import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  isStructurallyEligibleCardPurchase,
  mapCreditCardInstallmentRow,
  type CreditCardInstallment,
} from "../credit-card-installments";

export type EligibleCreditCardPurchase = {
  id: string;
  cardAccountId: string;
  description: string | null;
  amount: number;
  transactionDate: string;
  categoryId: string | null;
  status: string;
};

export async function listCreditCardInstallments(
  cardAccountId: string,
): Promise<CreditCardInstallment[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !cardAccountId) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("credit_card_installments")
      .select(
        "id, card_account_id, source_transaction_id, origin, description, principal, term_count, first_expected_date, program, calculation_source, conversion_fee_type, conversion_fee_rate_bps, conversion_fee_amount, fee_timing, flat_interest_rate_bps, total_interest_amount, quoted_total_repayment, status, note, credit_card_installment_schedule(id, installment_number, expected_date, principal_amount, conversion_fee_amount, interest_amount, total_amount, status, confirmed_at)",
      )
      .eq("household_id", gate.householdId)
      .eq("card_account_id", cardAccountId)
      .order("first_expected_date", { ascending: true });
    if (error) return null;
    return (data ?? []).map(mapCreditCardInstallmentRow);
  } catch {
    return null;
  }
}

/** Product eligibility only; issuer-specific rules remain user-confirmed. */
export async function listEligibleCreditCardPurchases(
  cardAccountId: string,
): Promise<EligibleCreditCardPurchase[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok || !cardAccountId) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: transactions, error: transactionError },
      { data: plans, error: planError },
    ] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, account_id, type, amount, note, transaction_date, category_id, status, reverses_transaction_id, corrects_transaction_id",
        )
        .eq("household_id", gate.householdId)
        .eq("account_id", cardAccountId)
        .eq("type", "expense")
        .gt("amount", 0)
        .order("transaction_date", { ascending: false })
        .limit(40),
      supabase
        .from("credit_card_installments")
        .select("source_transaction_id")
        .eq("household_id", gate.householdId)
        .eq("card_account_id", cardAccountId),
    ]);
    if (transactionError || planError) return null;
    const ids = (transactions ?? []).map((row) => row.id);
    const { data: related } = ids.length
      ? await supabase
          .from("transactions")
          .select("reverses_transaction_id, corrects_transaction_id")
          .eq("household_id", gate.householdId)
          .or(
            `reverses_transaction_id.in.(${ids.join(",")}),corrects_transaction_id.in.(${ids.join(",")})`,
          )
      : {
          data: [] as Array<{
            reverses_transaction_id: string | null;
            corrects_transaction_id: string | null;
          }>,
        };
    const reviewed = new Set(
      (related ?? [])
        .flatMap((row) => [
          row.reverses_transaction_id,
          row.corrects_transaction_id,
        ])
        .filter(Boolean),
    );
    const tracked = new Set(
      (plans ?? []).map((plan) => plan.source_transaction_id),
    );
    return (transactions ?? [])
      .filter((transaction) =>
        isStructurallyEligibleCardPurchase({
          amount: Number(transaction.amount),
          transactionType: transaction.type,
          hasRefundOrCorrection:
            Boolean(transaction.reverses_transaction_id) ||
            Boolean(transaction.corrects_transaction_id) ||
            reviewed.has(transaction.id),
          alreadyTracked: tracked.has(transaction.id),
        }),
      )
      .map((transaction) => ({
        id: transaction.id,
        cardAccountId: transaction.account_id,
        description: transaction.note,
        amount: Number(transaction.amount),
        transactionDate: transaction.transaction_date,
        categoryId: transaction.category_id,
        status: transaction.status,
      }));
  } catch {
    return null;
  }
}
