import { NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/server/audit";
import { computeSavingsCurrentValue, computeWithdrawalPreview } from "@/lib/savings/calculations";
import { withdrawBankSchema, withdrawThirdPartySchema } from "@/lib/savings/schemas";
import { fetchSavingsBundle } from "@/lib/savings/service";
import { getSavingsApiContext, getSystemSavingsCategories, insertSavingsTransaction } from "@/lib/savings/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const rawBody = await request.json().catch(() => null);

  try {
    const { supabase, user, householdId } = await getSavingsApiContext();
    const bundle = await fetchSavingsBundle(supabase, householdId, { id });
    const account = bundle.accounts[0];
    if (!account) {
      return NextResponse.json({ error: "Savings not found." }, { status: 404 });
    }

    const parsed =
      account.savings_type === "bank"
        ? withdrawBankSchema.safeParse(rawBody)
        : withdrawThirdPartySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (["withdrawn", "renewed", "cancelled"].includes(account.status)) {
      return NextResponse.json(
        { error: "Processed savings can no longer be withdrawn." },
        { status: 409 },
      );
    }

    const computed = computeSavingsCurrentValue(
      account,
      bundle.withdrawals.filter((row) => row.savings_account_id === id),
      parsed.data.withdrawalDate,
    );
    const requestedPrincipalAmount =
      account.savings_type === "third_party" &&
      "principalAmount" in parsed.data &&
      typeof parsed.data.principalAmount === "number"
        ? parsed.data.principalAmount
        : undefined;
    const preview = computeWithdrawalPreview(
      account,
      computed,
      requestedPrincipalAmount,
    );
    const categories = await getSystemSavingsCategories(supabase);

    const principalTransactionId = preview.principalPaid
      ? await insertSavingsTransaction(supabase, {
          householdId,
          accountId: parsed.data.destinationAccountId,
          userId: user.id,
          type: "income",
          amount: preview.principalPaid,
          transactionDate: parsed.data.withdrawalDate,
          description: `Savings withdrawal principal: ${account.provider_name}`,
          categoryId: categories.get("Savings Withdrawal") ?? null,
          subtype: "savings_principal_withdrawal",
          relatedSavingsId: id,
        })
      : null;
    const interestTransactionId = preview.interestPaid
      ? await insertSavingsTransaction(supabase, {
          householdId,
          accountId: parsed.data.destinationAccountId,
          userId: user.id,
          type: "income",
          amount: preview.interestPaid,
          transactionDate: parsed.data.withdrawalDate,
          description: `Savings interest: ${account.provider_name}`,
          categoryId: categories.get("Savings Interest") ?? null,
          subtype: "savings_interest_income",
          relatedSavingsId: id,
        })
      : null;
    const taxTransactionId = preview.taxAmount
      ? await insertSavingsTransaction(supabase, {
          householdId,
          accountId: parsed.data.destinationAccountId,
          userId: user.id,
          type: "expense",
          amount: preview.taxAmount,
          transactionDate: parsed.data.withdrawalDate,
          description: `Savings tax: ${account.provider_name}`,
          categoryId: categories.get("Savings Tax") ?? null,
          subtype: "savings_interest_tax",
          relatedSavingsId: id,
        })
      : null;
    const penaltyTransactionId = preview.penaltyAmount
      ? await insertSavingsTransaction(supabase, {
          householdId,
          accountId: parsed.data.destinationAccountId,
          userId: user.id,
          type: "expense",
          amount: preview.penaltyAmount,
          transactionDate: parsed.data.withdrawalDate,
          description: `Savings penalty: ${account.provider_name}`,
          categoryId: categories.get("Savings Penalty") ?? null,
          subtype: "savings_early_withdrawal_penalty",
          relatedSavingsId: id,
          isNonCash: true,
        })
      : null;

    const withdrawalInsert = await supabase
      .from("savings_withdrawals")
      .insert({
        savings_account_id: id,
        household_id: householdId,
        withdrawal_date: parsed.data.withdrawalDate,
        withdrawal_mode: preview.mode,
        requested_principal_amount: preview.principalPaid,
        gross_interest_amount: preview.interestPaid,
        tax_amount: preview.taxAmount,
        penalty_amount: preview.penaltyAmount,
        net_received_amount: preview.netReceived,
        destination_account_id: parsed.data.destinationAccountId,
        remaining_principal_after: preview.remainingPrincipal,
        principal_transaction_id: principalTransactionId,
        interest_transaction_id: interestTransactionId,
        tax_transaction_id: taxTransactionId,
        penalty_transaction_id: penaltyTransactionId,
        note: parsed.data.note ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (withdrawalInsert.error || !withdrawalInsert.data?.id) {
      return NextResponse.json(
        { error: withdrawalInsert.error?.message ?? "Failed to record withdrawal." },
        { status: 500 },
      );
    }

    await supabase
      .from("savings_accounts")
      .update({
        current_principal_remaining: preview.remainingPrincipal,
        status: preview.remainingPrincipal <= 0 ? "withdrawn" : account.status,
        closed_at: preview.remainingPrincipal <= 0 ? parsed.data.withdrawalDate : null,
      })
      .eq("household_id", householdId)
      .eq("id", id);

    await writeAuditEvent(supabase, {
      householdId,
      actorUserId: user.id,
      eventType: "savings.withdrawn",
      entityType: "savings_withdrawal",
      entityId: withdrawalInsert.data.id,
      payload: preview,
    });

    return NextResponse.json({
      withdrawalId: withdrawalInsert.data.id,
      principalPaid: preview.principalPaid,
      interestPaid: preview.interestPaid,
      taxAmount: preview.taxAmount,
      penaltyAmount: preview.penaltyAmount,
      netReceived: preview.netReceived,
      remainingPrincipal: preview.remainingPrincipal,
      status: preview.remainingPrincipal <= 0 ? "withdrawn" : account.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to withdraw savings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
