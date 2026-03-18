import { NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/server/audit";
import { computeSavingsProjection } from "@/lib/savings/calculations";
import { createSavingsSchema, savingsListQuerySchema } from "@/lib/savings/schemas";
import { fetchSavingsBundle, buildSavingsListItems, buildSavingsSummary } from "@/lib/savings/service";
import {
  assertSavingsLinkedAccounts,
  getAccountBalanceSnapshot,
  getSavingsApiContext,
  getSystemSavingsCategories,
  insertSavingsTransaction,
} from "@/lib/savings/server";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  return savingsListQuerySchema.safeParse({
    status: params.get("status") ?? undefined,
    savingsType: params.get("savingsType") ?? undefined,
    goalId: params.get("goalId") ?? undefined,
    includeProjection: params.get("includeProjection") ?? undefined,
  });
}

export async function GET(request: Request) {
  const parsed = parseQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { supabase, householdId } = await getSavingsApiContext();
    const bundle = await fetchSavingsBundle(supabase, householdId, {
      status: parsed.data.status,
      savingsType: parsed.data.savingsType,
      goalId: parsed.data.goalId,
    });
    const asOfDate = todayIso();
    const items = buildSavingsListItems(
      bundle.accounts,
      bundle.withdrawals,
      bundle.goals,
      asOfDate,
    );
    const summary = buildSavingsSummary(items);

    return NextResponse.json({
      items:
        parsed.data.includeProjection
          ? items.map((item) => {
              const account = bundle.accounts.find((row) => row.id === item.id)!;
              const withdrawals = bundle.withdrawals.filter(
                (row) => row.savings_account_id === item.id,
              );
              return {
                ...item,
                projection: computeSavingsProjection(
                  account,
                  withdrawals,
                  asOfDate,
                ),
              };
            })
          : items,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load savings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSavingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { supabase, user, householdId } = await getSavingsApiContext();
    const payload = parsed.data;
    const linkedAccountIds =
      payload.savingsType === "bank"
        ? [payload.primaryLinkedAccountId]
        : Array.from(
            new Set([payload.primaryLinkedAccountId, ...payload.linkedAccountIds]),
          );
    await assertSavingsLinkedAccounts(supabase, householdId, linkedAccountIds);

    const snapshot = await getAccountBalanceSnapshot(
      supabase,
      householdId,
      payload.primaryLinkedAccountId,
    );
    if (snapshot.error) {
      return NextResponse.json({ error: snapshot.error }, { status: 400 });
    }
    if (
      snapshot.balance !== null &&
      Math.round(payload.principalAmount) > snapshot.balance
    ) {
      return NextResponse.json(
        { error: "Savings principal exceeds source account balance." },
        { status: 422 },
      );
    }

    const startDate = payload.startDate;
    const maturityDate =
      payload.savingsType === "bank"
        ? new Date(
            new Date(`${startDate}T00:00:00.000Z`).getTime() +
              payload.termDays * 86_400_000,
          )
            .toISOString()
            .slice(0, 10)
        : payload.termMode === "fixed"
          ? new Date(
              new Date(`${startDate}T00:00:00.000Z`).getTime() +
                (payload.termDays ?? 0) * 86_400_000,
            )
              .toISOString()
              .slice(0, 10)
          : null;

    const categories = await getSystemSavingsCategories(supabase);
    const insert = await supabase
      .from("savings_accounts")
      .insert({
        household_id: householdId,
        goal_id: payload.goalId ?? null,
        savings_type: payload.savingsType,
        provider_name: payload.providerName,
        product_name: payload.productName ?? null,
        interest_type:
          payload.savingsType === "bank"
            ? "simple"
            : payload.interestType,
        term_mode:
          payload.savingsType === "bank"
            ? "fixed"
            : payload.termMode,
        term_days:
          payload.savingsType === "bank"
            ? payload.termDays
            : payload.termMode === "fixed"
              ? payload.termDays ?? 0
              : 0,
        principal_amount: Math.round(payload.principalAmount),
        current_principal_remaining: Math.round(payload.principalAmount),
        annual_rate: payload.annualRate,
        early_withdrawal_rate:
          payload.savingsType === "bank" ? payload.earlyWithdrawalRate : null,
        tax_rate: payload.savingsType === "bank" ? 0 : payload.taxRate,
        start_date: startDate,
        maturity_date: maturityDate,
        primary_linked_account_id: payload.primaryLinkedAccountId,
        linked_account_ids: linkedAccountIds,
        maturity_preference:
          payload.savingsType === "bank"
            ? payload.maturityPreference
            : payload.termMode === "fixed"
              ? payload.maturityPreference ?? "withdraw"
              : null,
        status:
          maturityDate && maturityDate < todayIso() ? "matured" : "active",
        notes: payload.notes ?? null,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (insert.error || !insert.data?.id) {
      return NextResponse.json(
        { error: insert.error?.message ?? "Failed to create savings account." },
        { status: 500 },
      );
    }

    await supabase.from("savings_rate_history").insert({
      household_id: householdId,
      provider_name: payload.providerName,
      product_name: payload.productName ?? null,
      savings_type: payload.savingsType,
      interest_type:
        payload.savingsType === "bank"
          ? "simple"
          : payload.interestType,
      term_mode:
        payload.savingsType === "bank"
          ? "fixed"
          : payload.termMode,
      term_days:
        payload.savingsType === "bank"
          ? payload.termDays
          : payload.termMode === "fixed"
            ? payload.termDays ?? 0
            : 0,
      annual_rate: payload.annualRate,
      early_withdrawal_rate:
        payload.savingsType === "bank" ? payload.earlyWithdrawalRate : null,
      tax_rate: payload.savingsType === "bank" ? 0 : payload.taxRate,
      effective_from: startDate,
      source: "manual",
      created_by: user.id,
    });

    const transactionId = await insertSavingsTransaction(supabase, {
      householdId,
      accountId: payload.primaryLinkedAccountId,
      userId: user.id,
      type: "expense",
      amount: payload.principalAmount,
      transactionDate: startDate,
      description: `Savings deposit: ${payload.providerName}`,
      categoryId: categories.get("Savings Deposit") ?? null,
      subtype: "savings_principal_deposit",
      relatedSavingsId: insert.data.id,
    });

    await writeAuditEvent(supabase, {
      householdId,
      actorUserId: user.id,
      eventType: "savings.created",
      entityType: "savings_account",
      entityId: insert.data.id,
      payload: {
        transactionId,
        savingsType: payload.savingsType,
        providerName: payload.providerName,
      },
    });

    const bundle = await fetchSavingsBundle(supabase, householdId, {
      id: insert.data.id,
    });
    const account = bundle.accounts[0]!;
    const projection = computeSavingsProjection(account, bundle.withdrawals, todayIso());

    return NextResponse.json({
      id: insert.data.id,
      status: account.status,
      projection,
      transactionsCreated: [transactionId],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create savings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
