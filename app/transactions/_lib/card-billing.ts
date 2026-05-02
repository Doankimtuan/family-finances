import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getAccountType(
  supabase: SupabaseClient,
  householdId: string,
  accountId: string,
): Promise<string | null> {
  const result = await supabase
    .from("accounts")
    .select("type")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .maybeSingle();
  if (result.error || !result.data?.type) return null;
  return result.data.type;
}

export function signedCardAmount(type: string, amount: number): number {
  return type === "income" ? -Math.round(amount) : Math.round(amount);
}

export async function resolveCardBillingMonth(
  supabase: SupabaseClient,
  householdId: string,
  cardAccountId: string,
  transactionDate: string,
): Promise<{ id: string; billing_month: string } | null> {
  const settings = await supabase
    .from("credit_card_settings")
    .select("statement_day")
    .eq("account_id", cardAccountId)
    .maybeSingle();
  const statementDay = settings.data?.statement_day ?? 25;

  const d = new Date(`${transactionDate}T00:00:00.000Z`);
  let year = d.getUTCFullYear();
  let monthIdx = d.getUTCMonth();
  if (d.getUTCDate() > statementDay) {
    monthIdx += 1;
    if (monthIdx > 11) {
      monthIdx = 0;
      year += 1;
    }
  }
  const billingMonth = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;

  await supabase.from("card_billing_months").upsert(
    {
      household_id: householdId,
      card_account_id: cardAccountId,
      billing_month: billingMonth,
    },
    { onConflict: "card_account_id,billing_month" },
  );

  const monthResult = await supabase
    .from("card_billing_months")
    .select("id, billing_month")
    .eq("card_account_id", cardAccountId)
    .eq("billing_month", billingMonth)
    .maybeSingle();

  if (monthResult.error || !monthResult.data) return null;
  return monthResult.data;
}

/**
 * Handles all synchronization logic for credit card billing when a transaction is updated or moved.
 */
export async function syncCardBillingOnUpdate(
  supabase: SupabaseClient,
  householdId: string,
  transactionId: string,
  params: {
    prevAccountId: string;
    prevAmount: number;
    prevType: string;
    prevDate: string;
    nextAccountId: string;
    nextAmount: number;
    nextType: string;
    nextDate: string;
    nextDescription: string | null;
  }
): Promise<{ error?: string }> {
  const {
    prevAccountId, prevAmount, prevType, prevDate,
    nextAccountId, nextAmount, nextType, nextDate, nextDescription
  } = params;

  const prevSigned = signedCardAmount(prevType, prevAmount);
  const nextSigned = signedCardAmount(nextType, nextAmount);

  const prevAccountType = prevAccountId
    ? await getAccountType(supabase, householdId, prevAccountId)
    : null;
  const nextAccountType = await getAccountType(supabase, householdId, nextAccountId);

  const prevIsCard = prevAccountType === "credit_card";
  const nextIsCard = nextAccountType === "credit_card";

  if (!prevIsCard && !nextIsCard) return {};

  const billingItemResult = await supabase
    .from("card_billing_items")
    .select("id, billing_month_id, card_account_id, is_converted_to_installment, item_type")
    .eq("household_id", householdId)
    .eq("transaction_id", transactionId)
    .maybeSingle();

  const billingItem = billingItemResult.data;

  if (billingItem?.is_converted_to_installment) {
    const financiallySensitiveChanged =
      prevAmount !== nextAmount ||
      prevDate !== nextDate ||
      prevAccountId !== nextAccountId;
    if (financiallySensitiveChanged) {
      return { error: "Cannot edit amount/date/account for a transaction already converted to installments." };
    }
    return {};
  }

  if (billingItem && billingItem.item_type === "standard") {
    const oldMonthId = billingItem.billing_month_id;
    const oldCardId = billingItem.card_account_id;

    if (!nextIsCard) {
      // Moved away from card account: remove billing item + statement contribution.
      await supabase.rpc("increment_statement_amount", {
        month_id: oldMonthId,
        inc: -prevSigned,
      });
      await supabase
        .from("card_billing_items")
        .delete()
        .eq("id", billingItem.id);
    } else {
      const targetMonth = await resolveCardBillingMonth(
        supabase,
        householdId,
        nextAccountId,
        nextDate,
      );
      if (targetMonth) {
        const sameMonth = oldMonthId === targetMonth.id;
        const sameCard = oldCardId === nextAccountId;

        if (sameMonth && sameCard) {
          const delta = nextSigned - prevSigned;
          if (delta !== 0) {
            await supabase.rpc("increment_statement_amount", {
              month_id: oldMonthId,
              inc: delta,
            });
          }
          await supabase
            .from("card_billing_items")
            .update({
              card_account_id: nextAccountId,
              amount: nextAmount,
              description: nextDescription,
            })
            .eq("id", billingItem.id);
        } else {
          await supabase.rpc("increment_statement_amount", {
            month_id: oldMonthId,
            inc: -prevSigned,
          });
          await supabase.rpc("increment_statement_amount", {
            month_id: targetMonth.id,
            inc: nextSigned,
          });
          await supabase
            .from("card_billing_items")
            .update({
              card_account_id: nextAccountId,
              billing_month_id: targetMonth.id,
              amount: nextAmount,
              description: nextDescription,
            })
            .eq("id", billingItem.id);
        }
      }
    }
  } else if (!billingItem && nextIsCard && (nextType === "expense" || nextType === "income")) {
    // Was non-card before, now moved to card: create matching standard billing item.
    const targetMonth = await resolveCardBillingMonth(
      supabase,
      householdId,
      nextAccountId,
      nextDate,
    );
    if (targetMonth) {
      await supabase.from("card_billing_items").insert({
        household_id: householdId,
        card_account_id: nextAccountId,
        billing_month_id: targetMonth.id,
        transaction_id: transactionId,
        description: nextDescription ?? `Giao dịch thẻ ${nextDate}`,
        amount: nextAmount,
        item_type: "standard",
      });
      await supabase.rpc("increment_statement_amount", {
        month_id: targetMonth.id,
        inc: nextSigned,
      });
    }
  }

  return {};
}

/**
 * Handles cleanup of credit card billing when a transaction is deleted.
 */
export async function syncCardBillingOnDelete(
  supabase: SupabaseClient,
  householdId: string,
  transactionId: string,
  params: {
    accountId: string;
    amount: number;
    type: string;
  }
): Promise<{ error?: string }> {
  const { accountId, amount, type } = params;
  const signedAmount = signedCardAmount(type, amount);

  const accountType = await getAccountType(supabase, householdId, accountId);
  const isCard = accountType === "credit_card";

  if (!isCard) return {};

  const billingItemResult = await supabase
    .from("card_billing_items")
    .select("id, billing_month_id, is_converted_to_installment, item_type")
    .eq("household_id", householdId)
    .eq("transaction_id", transactionId)
    .maybeSingle();

  const billingItem = billingItemResult.data;
  if (billingItem?.is_converted_to_installment) {
    return { error: "Cannot delete a transaction already converted to installments." };
  }

  if (billingItem && billingItem.item_type === "standard") {
    await supabase.rpc("increment_statement_amount", {
      month_id: billingItem.billing_month_id,
      inc: -signedAmount,
    });
    await supabase
      .from("card_billing_items")
      .delete()
      .eq("id", billingItem.id);
  }

  return {};
}
