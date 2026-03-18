import { NextResponse } from "next/server";

import { isServerFeatureEnabled } from "@/lib/config/features";
import { getDashboardTrend } from "@/lib/dashboard/trend";
import type {
  DashboardCoreMetrics,
  DashboardCoreResponse,
  DashboardTrendPoint,
} from "@/lib/dashboard/types";
import type { SpendingJarSummaryRow } from "@/lib/jars/spending";
import {
  buildSavingsListItems,
  buildSavingsSummary,
  fetchSavingsBundle,
} from "@/lib/savings/service";
import { createClient } from "@/lib/supabase/server";

type RpcError = { message: string };

function monthRange(asOfDate: string) {
  const date = new Date(asOfDate);
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );
  return {
    startISO: start.toISOString().slice(0, 10),
    endISO: end.toISOString().slice(0, 10),
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0)
    return error.message;
  return fallback;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asOfDate =
      searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);
    const months = Number(searchParams.get("months") ?? "6");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const householdResult = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (householdResult.error) {
      return NextResponse.json(
        {
          error: `Failed to resolve household: ${householdResult.error.message}`,
        },
        { status: 500 },
      );
    }

    if (!householdResult.data?.household_id) {
      return NextResponse.json(
        { error: "No household found. Create or join a household first." },
        { status: 404 },
      );
    }

    const householdId = householdResult.data.household_id;
    const { startISO, endISO } = monthRange(asOfDate);
    const jarsEnabled = isServerFeatureEnabled("jars");
    const requestedMonths = Number.isFinite(months)
      ? Math.max(1, Math.round(months))
      : 6;

    const [
      coreResult,
      trend,
      accountsResult,
      assetsResult,
      pricesResult,
      liabilitiesResult,
      txBalanceResult,
      txMonthResult,
      categoriesResult,
      ccBillingResult,
      ccAccountsResult,
      jarsOverviewResult,
      spendingJarSummaryResult,
      goalsResult,
      contributionsResult,
      recentTxResult,
      billingsResult,
    ] = await Promise.all([
      supabase.rpc("rpc_dashboard_core", {
        p_household_id: householdId,
        p_as_of_date: asOfDate,
      }),
      getDashboardTrend(supabase, householdId, {
        months: requestedMonths,
        asOfDate,
      }),
      supabase
        .from("accounts")
        .select("id, name, opening_balance")
        .eq("household_id", householdId)
        .eq("is_archived", false),
      supabase
        .from("assets")
        .select("id, name, quantity")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .eq("include_in_net_worth", true),
      supabase
        .from("asset_price_history")
        .select("asset_id, unit_price, as_of_date")
        .eq("household_id", householdId)
        .lte("as_of_date", asOfDate)
        .order("as_of_date", { ascending: false }),
      supabase
        .from("liabilities")
        .select("id, name, current_principal_outstanding")
        .eq("household_id", householdId)
        .eq("is_active", true)
        .eq("include_in_net_worth", true),
      // All-time balance transactions
      supabase
        .from("transactions")
        .select(
          "account_id, counterparty_account_id, type, amount, transaction_subtype, is_non_cash",
        )
        .eq("household_id", householdId)
        .lte("transaction_date", asOfDate),
      // This-month transactions for category breakdown (no join needed)
      supabase
        .from("transactions")
        .select(
          "account_id, category_id, type, amount, transaction_subtype, is_non_cash",
        )
        .eq("household_id", householdId)
        .gte("transaction_date", startISO)
        .lt("transaction_date", endISO),
      supabase
        .from("categories")
        .select("id, name, color")
        .or(`household_id.is.null,household_id.eq.${householdId}`),
      // Credit card billing items for this calendar month
      supabase
        .from("card_billing_items")
        .select(
          "amount, fee_amount, is_converted_to_installment, card_billing_months!billing_month_id(billing_month)",
        )
        .eq("household_id", householdId)
        .eq("is_converted_to_installment", false),
      // Fetch CC account IDs so we can exclude them from raw expense sum
      supabase
        .from("accounts")
        .select("id")
        .eq("household_id", householdId)
        .eq("type", "credit_card")
        .eq("is_archived", false),
      jarsEnabled
        ? supabase
            .from("jar_monthly_overview")
            .select(
              "jar_id, name, color, icon, target_amount, allocated_amount, withdrawn_amount, net_amount, coverage_ratio",
            )
            .eq("household_id", householdId)
            .eq("month", startISO)
        : Promise.resolve({ data: [], error: null }),
      jarsEnabled
        ? supabase.rpc("rpc_spending_jar_monthly_summary", {
            p_household_id: householdId,
            p_month: startISO,
          })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("goals")
        .select("id, name, target_amount, status, target_date")
        .eq("household_id", householdId)
        .eq("status", "active")
        .limit(3),
      supabase
        .from("goal_contributions")
        .select("goal_id, amount, flow_type")
        .eq("household_id", householdId),
      supabase
        .from("transactions")
        .select(
          "id, type, amount, transaction_date, description, category_id, transaction_subtype, is_non_cash",
        )
        .eq("household_id", householdId)
        .order("transaction_date", { ascending: false })
        .limit(5),
      supabase
        .from("card_billings")
        .select(
          `
          id,
          due_date,
          status,
          statement_balance,
          accounts!account_id (name)
        `,
        )
        .eq("household_id", householdId)
        .eq("status", "pending")
        .lte(
          "due_date",
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        ),
    ]);

    if (coreResult.error) {
      const coreErr = coreResult.error as RpcError;
      return NextResponse.json(
        { error: `rpc_dashboard_core failed: ${coreErr.message}` },
        { status: 500 },
      );
    }

    const goalsRaw = goalsResult.data ?? [];
    const goalContributions = contributionsResult.data ?? [];
    const recentTxRaw = recentTxResult.data ?? [];
    const upcomingBills = billingsResult.data ?? [];
    const goalsTyped = goalsRaw as Array<{
      id: string;
      name: string;
      target_amount: number;
      target_date: string | null;
      status: string;
    }>;
    const contributionsTyped = goalContributions as Array<{
      goal_id: string;
      amount: number;
      flow_type: "inflow" | "outflow";
    }>;
    const recentTxTyped = recentTxRaw as Array<{
      id: string;
      type: string;
      amount: number;
      transaction_date: string;
      description: string | null;
      category_id: string | null;
    }>;
    const upcomingBillsTyped = upcomingBills as Array<{
      id: string;
      due_date: string;
      statement_balance: number;
      accounts: Array<{ name: string }> | null;
    }>;

    const categoryMap = new Map(
      (categoriesResult.data ?? []).map((c) => [
        c.id,
        { name: c.name, color: c.color as string | null },
      ]),
    );

    const goals = goalsTyped.map((goal) => {
      const currentAmount = contributionsTyped
        .filter((c) => c.goal_id === goal.id)
        .reduce(
          (sum: number, c) =>
            sum +
            (c.flow_type === "inflow" ? Number(c.amount) : -Number(c.amount)),
          0,
        );
      return {
        id: goal.id,
        name: goal.name,
        current_amount: currentAmount,
        target_amount: Number(goal.target_amount),
        target_date: goal.target_date,
        status: goal.status,
      };
    });

    const recentTransactions = recentTxTyped.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      transaction_date: tx.transaction_date,
      description: tx.description,
      category_name: categoryMap.get(tx.category_id ?? "")?.name ?? null,
    }));

    const priorityActions = upcomingBillsTyped.map((bill) => ({
      id: bill.id,
      title: `Thanh toán thẻ ${bill.accounts?.[0]?.name ?? ""}`,
      description: "Dư nợ sao kê cần thanh toán",
      amount: Number(bill.statement_balance),
      dueDate: bill.due_date,
      priority: "high" as const,
    }));

    if (
      accountsResult.error ||
      assetsResult.error ||
      pricesResult.error ||
      liabilitiesResult.error ||
      txBalanceResult.error ||
      txMonthResult.error ||
      categoriesResult.error
      || jarsOverviewResult.error
      || spendingJarSummaryResult.error
    ) {
      return NextResponse.json(
        {
          error:
            accountsResult.error?.message ??
            assetsResult.error?.message ??
            pricesResult.error?.message ??
            liabilitiesResult.error?.message ??
            txBalanceResult.error?.message ??
            txMonthResult.error?.message ??
            categoriesResult.error?.message ??
            jarsOverviewResult.error?.message ??
            spendingJarSummaryResult.error?.message ??
            "Failed to build dashboard drill-downs.",
        },
        { status: 500 },
      );
    }

    const monthTransactions = txMonthResult.data ?? [];
    const balanceTransactions = txBalanceResult.data ?? [];
    const savingsBundle = await fetchSavingsBundle(supabase, householdId);
    const savingsItems = buildSavingsListItems(
      savingsBundle.accounts,
      savingsBundle.withdrawals,
      savingsBundle.goals,
      asOfDate,
    );
    const savingsSummary = buildSavingsSummary(savingsItems);
    const ccBillingItems = ccBillingResult.data ?? [];
    const jarOverviewRows = (jarsOverviewResult.data ?? []) as Array<{
      jar_id: string;
      name: string;
      color: string | null;
      icon: string | null;
      target_amount: number;
      allocated_amount: number;
      withdrawn_amount: number;
      net_amount: number;
      coverage_ratio: number;
    }>;
    const spendingJarSummaryRows =
      (spendingJarSummaryResult.data ?? []) as SpendingJarSummaryRow[];
    // Set of credit card account IDs — used to skip their raw expense transactions
    const ccAccountIds = new Set(
      (ccAccountsResult.data ?? []).map((a) => a.id),
    );

    // Build account → delta map for net-worth balances
    const accountDeltaMap = new Map<string, number>();
    for (const tx of balanceTransactions) {
      if (tx.is_non_cash) continue;
      const amount = Number(tx.amount ?? 0);
      const sourceId = tx.account_id;
      const targetId = tx.counterparty_account_id;

      if (tx.type === "income" && sourceId) {
        accountDeltaMap.set(
          sourceId,
          (accountDeltaMap.get(sourceId) ?? 0) + amount,
        );
      }

      if (tx.type === "expense" && sourceId) {
        accountDeltaMap.set(
          sourceId,
          (accountDeltaMap.get(sourceId) ?? 0) - amount,
        );
      }

      if (tx.type === "transfer") {
        if (sourceId) {
          accountDeltaMap.set(
            sourceId,
            (accountDeltaMap.get(sourceId) ?? 0) - amount,
          );
        }
        if (targetId) {
          accountDeltaMap.set(
            targetId,
            (accountDeltaMap.get(targetId) ?? 0) + amount,
          );
        }
      }
    }

    // categoryMap moved up

    const latestPriceMap = new Map<string, number>();
    for (const p of pricesResult.data ?? []) {
      if (!latestPriceMap.has(p.asset_id))
        latestPriceMap.set(p.asset_id, Number(p.unit_price));
    }

    const assetLineItems = [
      ...(accountsResult.data ?? []).map((a) => ({
        label: a.name,
        value: Number(a.opening_balance) + (accountDeltaMap.get(a.id) ?? 0),
        source: `accounts:${a.id}+transactions(<=${asOfDate})`,
      })),
      ...(assetsResult.data ?? []).map((a) => ({
        label: a.name,
        value: Number(a.quantity) * (latestPriceMap.get(a.id) ?? 0),
        source: `assets:${a.id}*asset_price_history(latest<=${asOfDate})`,
      })),
      ...savingsItems.map((item) => ({
        label: `${item.providerName} (${item.productName ?? "Savings"})`,
        value: item.currentValue.grossValue,
        source: `savings_accounts:${item.id}`,
      })),
    ];

    const liabilityLineItems = (liabilitiesResult.data ?? []).map((l) => ({
      label: l.name,
      value: Number(l.current_principal_outstanding),
      source: `liabilities:${l.id}`,
    }));

    // ── Category breakdown for this month ─────────────────────────────────────
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    for (const tx of monthTransactions) {
      if (tx.is_non_cash) continue;
      if (
        tx.transaction_subtype === "savings_principal_deposit" ||
        tx.transaction_subtype === "savings_principal_withdrawal"
      ) {
        continue;
      }
      if (!tx.category_id) continue;

      // Skip expense transactions from credit_card accounts —
      // those are handled via card_billing_items to reflect installment amounts.
      if (tx.type === "expense" && ccAccountIds.has(tx.account_id)) {
        continue;
      }

      if (tx.type === "income") {
        incomeMap.set(
          tx.category_id,
          (incomeMap.get(tx.category_id) ?? 0) + Number(tx.amount),
        );
      }
      if (tx.type === "expense") {
        expenseMap.set(
          tx.category_id,
          (expenseMap.get(tx.category_id) ?? 0) + Number(tx.amount),
        );
      }
    }

    // Add CC billing items for this calendar month into a single "Thẻ tín dụng" bucket
    // so the donut chart correctly shows installment amounts (not the full transaction).
    const CC_CATEGORY_KEY = "__credit_card__";
    let ccTotal = 0;
    for (const item of ccBillingItems) {
      const billingMonth: string =
        (item.card_billing_months as { billing_month?: string } | null)
          ?.billing_month ?? "";
      // Only include items whose billing_month falls in the current calendar month
      if (billingMonth >= startISO && billingMonth < endISO) {
        ccTotal += Number(item.amount) + Number(item.fee_amount);
      }
    }
    if (ccTotal > 0) {
      expenseMap.set(
        CC_CATEGORY_KEY,
        (expenseMap.get(CC_CATEGORY_KEY) ?? 0) + ccTotal,
      );
    }

    const incomeItems = Array.from(incomeMap.entries()).map(
      ([categoryId, value]) => ({
        label: categoryMap.get(categoryId)?.name ?? "Uncategorized income",
        color: categoryMap.get(categoryId)?.color ?? null,
        value,
        source: `transactions.category:${categoryId}(${startISO}..${endISO})`,
      }),
    );

    const expenseItems = Array.from(expenseMap.entries()).map(
      ([categoryId, value]) => ({
        label:
          categoryId === CC_CATEGORY_KEY
            ? "Thẻ tín dụng"
            : (categoryMap.get(categoryId)?.name ?? "Uncategorized expense"),
        color:
          categoryId === CC_CATEGORY_KEY
            ? "#BE123C"
            : (categoryMap.get(categoryId)?.color ?? null),
        value,
        source:
          categoryId === CC_CATEGORY_KEY
            ? `card_billing_items(${startISO}..${endISO})`
            : `transactions.category:${categoryId}(${startISO}..${endISO})`,
      }),
    );

    const payload: DashboardCoreResponse = {
      metrics: (() => {
        const core =
          ((coreResult.data as DashboardCoreMetrics[] | null) ?? [])[0] ?? null;
        if (!core) return null;

        const adjustedIncome = monthTransactions
          .filter(
            (tx) =>
              !tx.is_non_cash &&
              tx.type === "income" &&
              tx.transaction_subtype !== "savings_principal_withdrawal",
          )
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const adjustedExpense = monthTransactions
          .filter(
            (tx) =>
              !tx.is_non_cash &&
              tx.type === "expense" &&
              tx.transaction_subtype !== "savings_principal_deposit",
          )
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const adjustedSavings = adjustedIncome - adjustedExpense;
        const adjustedTotalAssets =
          Number(core.total_assets) + savingsSummary.totalGrossValue;
        const adjustedNetWorth =
          adjustedTotalAssets - Number(core.total_liabilities);

        return {
          ...core,
          total_assets: adjustedTotalAssets,
          net_worth: adjustedNetWorth,
          monthly_income: adjustedIncome,
          monthly_expense: adjustedExpense,
          monthly_savings: adjustedSavings,
          savings_rate:
            adjustedIncome > 0 ? adjustedSavings / adjustedIncome : null,
          savings_gross_value: savingsSummary.totalGrossValue,
          savings_liquidation_value: savingsSummary.totalLiquidationValue,
          savings_locked_value:
            savingsSummary.totalGrossValue - savingsSummary.totalLiquidationValue,
          maturing_30d_value: savingsItems
            .filter((item) => item.daysUntilMaturity !== null && item.daysUntilMaturity <= 30)
            .reduce((sum, item) => sum + item.currentValue.grossValue, 0),
        };
      })(),
      trend: (trend as DashboardTrendPoint[]).slice(),
      health: null,
      drilldowns: {
        netWorth: {
          assets: assetLineItems.sort((a, b) => b.value - a.value),
          liabilities: liabilityLineItems.sort((a, b) => b.value - a.value),
        },
        cashFlow: {
          income: incomeItems.sort((a, b) => b.value - a.value),
          expense: expenseItems.sort((a, b) => b.value - a.value),
          monthStart: startISO,
          monthEnd: endISO,
        },
      },
      goals,
      recentTransactions,
      priorityActions,
      jars: jarsEnabled
        ? jarOverviewRows
        .filter((row) => Number(row.target_amount) > 0)
        .sort(
          (a, b) =>
            Number(a.coverage_ratio ?? 0) - Number(b.coverage_ratio ?? 0),
        )
        .slice(0, 3)
        .map((row) => ({
          jar_id: row.jar_id,
          name: row.name,
          color: row.color,
          icon: row.icon,
          target_amount: Number(row.target_amount),
          allocated_amount: Number(row.allocated_amount),
          withdrawn_amount: Number(row.withdrawn_amount),
          net_amount: Number(row.net_amount),
          coverage_ratio: Number(row.coverage_ratio),
        }))
        : [],
      spendingJarAlerts: jarsEnabled
        ? spendingJarSummaryRows
            .filter(
              (row) =>
                row.alert_level === "warning" || row.alert_level === "exceeded",
            )
            .sort(
              (a, b) => Number(b.usage_percent ?? 0) - Number(a.usage_percent ?? 0),
            )
            .map((row) => ({
              jarId: row.jar_id,
              jarName: row.jar_name,
              usagePercent:
                row.usage_percent === null || row.usage_percent === undefined
                  ? null
                  : Number(row.usage_percent),
              alertLevel: row.alert_level,
              spent: Number(row.monthly_spent ?? 0),
              limit: Number(row.monthly_limit ?? 0),
            }))
        : [],
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error, "Unexpected server error") },
      { status: 500 },
    );
  }
}
