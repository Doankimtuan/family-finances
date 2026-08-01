import { NextResponse } from "next/server";

import { syncSavingsReleaseToJarIntent } from "@/lib/jars/intent";
import { computeSavingsCurrentValue, computeWithdrawalPreview } from "@/lib/savings/calculations";
import { matureSavingsSchema } from "@/lib/savings/schemas";
import { fetchSavingsBundle } from "@/lib/savings/service";
import {
  getSavingsApiContext,
  getSystemSavingsCategories,
  insertSavingsTransaction,
} from "@/lib/savings/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const parsed = matureSavingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const { supabase, householdId, user } = await getSavingsApiContext();
    const bundle = await fetchSavingsBundle(supabase, householdId, { id });
    const account = bundle.accounts[0];
    if (!account) {
      return NextResponse.json({ error: "Savings not found." }, { status: 404 });
    }
    if (account.term_mode !== "fixed") {
      return NextResponse.json(
        { error: "Flexible savings do not support maturity processing." },
        { status: 400 },
      );
    }

    const update = await supabase
      .from("savings_accounts")
      .update({
        maturity_preference: parsed.data.actionType,
        next_plan_config: parsed.data.newPlan ?? account.next_plan_config,
      })
      .eq("household_id", householdId)
      .eq("id", id);
    if (update.error) {
      return NextResponse.json({ error: update.error.message }, { status: 500 });
    }

    const rpc = await supabase.rpc("process_savings_maturity", {
      p_savings_id: id,
      p_action_date: parsed.data.actionDate,
      p_execution_mode: "manual",
    });
    if (rpc.error) {
      return NextResponse.json({ error: rpc.error.message }, { status: 409 });
    }

    if (parsed.data.actionType === "withdraw") {
      const computed = computeSavingsCurrentValue(
        account,
        bundle.withdrawals.filter((row) => row.savings_account_id === id),
        parsed.data.actionDate,
      );
      const preview = computeWithdrawalPreview(account, computed);
      const destinationAccountId =
        parsed.data.destinationAccountId ?? account.primary_linked_account_id;
      const categories = await getSystemSavingsCategories(supabase);

      const principalTransactionId = preview.principalPaid
        ? await insertSavingsTransaction(supabase, {
            householdId,
            accountId: destinationAccountId,
            userId: user.id,
            type: "income",
            amount: preview.principalPaid,
            transactionDate: parsed.data.actionDate,
            description: `Savings withdrawal principal: ${account.provider_name}`,
            categoryId: categories.get("Savings Withdrawal") ?? null,
            subtype: "savings_principal_withdrawal",
            relatedSavingsId: id,
          })
        : null;
      const interestTransactionId = preview.interestPaid
        ? await insertSavingsTransaction(supabase, {
            householdId,
            accountId: destinationAccountId,
            userId: user.id,
            type: "income",
            amount: preview.interestPaid,
            transactionDate: parsed.data.actionDate,
            description: `Savings interest: ${account.provider_name}`,
            categoryId: categories.get("Savings Interest") ?? null,
            subtype: "savings_interest_income",
            relatedSavingsId: id,
          })
        : null;
      const taxTransactionId = preview.taxAmount
        ? await insertSavingsTransaction(supabase, {
            householdId,
            accountId: destinationAccountId,
            userId: user.id,
            type: "expense",
            amount: preview.taxAmount,
            transactionDate: parsed.data.actionDate,
            description: `Savings tax: ${account.provider_name}`,
            categoryId: categories.get("Savings Tax") ?? null,
            subtype: "savings_interest_tax",
            relatedSavingsId: id,
          })
        : null;

      await supabase.from("savings_withdrawals").insert({
        savings_account_id: id,
        household_id: householdId,
        withdrawal_date: parsed.data.actionDate,
        withdrawal_mode: "full",
        requested_principal_amount: preview.principalPaid,
        gross_interest_amount: preview.interestPaid,
        tax_amount: preview.taxAmount,
        penalty_amount: preview.penaltyAmount,
        net_received_amount: preview.netReceived,
        destination_account_id: destinationAccountId,
        destination_jar_id: parsed.data.destinationJarId ?? null,
        remaining_principal_after: 0,
        principal_transaction_id: principalTransactionId,
        interest_transaction_id: interestTransactionId,
        tax_transaction_id: taxTransactionId,
        created_by: user.id,
      });

      await syncSavingsReleaseToJarIntent(supabase, {
        householdId,
        userId: user.id,
        sourceType: "savings_mature",
        sourceId: id,
        savingsId: id,
        movementDate: parsed.data.actionDate,
        providerName: account.provider_name,
        principalAmount: preview.principalPaid,
        interestAmount: preview.interestPaid,
        taxAmount: preview.taxAmount,
        destinationJarId: parsed.data.destinationJarId ?? null,
      });
    }

    const refreshed = await fetchSavingsBundle(supabase, householdId, { id });
    const actions = refreshed.actions.filter((row) => row.savings_account_id === id);
    const latestAction = actions[0];

    return NextResponse.json({
      actionId: rpc.data,
      parentStatus:
        refreshed.accounts.find((row) => row.id === id)?.status ?? account.status,
      childId: latestAction?.child_savings_account_id ?? null,
      payoutNet: latestAction?.net_rollover_amount ?? null,
      grossInterest: latestAction?.gross_interest_amount ?? 0,
      taxAmount: latestAction?.tax_amount ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process maturity." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
