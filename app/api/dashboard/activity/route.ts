import { NextResponse } from "next/server";

import { TIME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

import { getHouseholdId, monthRange, toErrorMessage } from "../_shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);
    const limit = Number(searchParams.get("limit") ?? "5");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let householdId: string | null = null;
    try {
      householdId = await getHouseholdId(supabase, user.id);
    } catch {
      // User has no household, return empty data
      const { startISO, endISO } = monthRange(asOfDate);
      const payload = {
        recentTransactions: [],
        priorityActions: [],
        monthRange: { start: startISO, end: endISO },
      };
      const response = NextResponse.json(payload, { status: 200 });
      response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
      return response;
    }

    const { startISO, endISO } = monthRange(asOfDate);
    const txLimit = Math.max(1, Math.min(20, Math.round(limit)));

    const [recentTxResult, billingsResult, categoriesResult] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, type, amount, transaction_date, description, category_id, transaction_subtype, is_non_cash",
        )
        .eq("household_id", householdId)
        .order("transaction_date", { ascending: false })
        .limit(txLimit),
      supabase
        .from("card_billing_months")
        .select(
          `
          id,
          due_date,
          status,
          statement_amount,
          accounts!card_account_id (name)
        `,
        )
        .eq("household_id", householdId)
        .in("status", ["open", "partial"])
        .lte(
          "due_date",
          new Date(Date.now() + TIME.MS_PER_WEEK)
            .toISOString()
            .slice(0, 10),
        ),
      supabase
        .from("categories")
        .select("id, name, color")
        .or(`household_id.is.null,household_id.eq.${householdId}`),
    ]);

    if (recentTxResult.error || billingsResult.error || categoriesResult.error) {
      return NextResponse.json(
        {
          error:
            recentTxResult.error?.message ??
            billingsResult.error?.message ??
            categoriesResult.error?.message ??
            "Failed to load activity data.",
        },
        { status: 500 },
      );
    }

    const categoryMap = new Map(
      (categoriesResult.data ?? []).map((c) => [
        c.id,
        { name: c.name, color: c.color as string | null },
      ]),
    );

    const recentTransactions = (recentTxResult.data ?? []).map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      transaction_date: tx.transaction_date,
      description: tx.description,
      category_name: categoryMap.get(tx.category_id ?? "")?.name ?? null,
      category_color: categoryMap.get(tx.category_id ?? "")?.color ?? null,
    }));

    const priorityActions = (billingsResult.data ?? []).map((bill) => ({
      id: bill.id,
      title: `Pay card ${(bill.accounts as unknown as Array<{ name: string }> | null)?.[0]?.name ?? ""}`,
      description: "Statement balance due",
      amount: Number(bill.statement_amount),
      dueDate: bill.due_date,
      priority: "high" as const,
    }));

    const payload = {
      recentTransactions,
      priorityActions,
      monthRange: { start: startISO, end: endISO },
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Unexpected server error") },
      { status: 500 },
    );
  }
}
