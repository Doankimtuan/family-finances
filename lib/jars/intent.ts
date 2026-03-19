import type { SupabaseClient } from "@supabase/supabase-js";

export type JarPreset = {
  name: string;
  slug: string;
  color: string;
  icon: string;
  jarType:
    | "essential"
    | "investment"
    | "long_term_saving"
    | "education"
    | "play"
    | "give";
  monthlyStrategy: "percent";
  incomePercent: number;
  spendPolicy:
    | "flexible"
    | "invest_only"
    | "long_term_only"
    | "must_spend"
    | "give_only";
  sortOrder: number;
};

export const JAR_PRESET_6: JarPreset[] = [
  {
    name: "Thiết yếu",
    slug: "essential",
    color: "#2563EB",
    icon: "house",
    jarType: "essential",
    monthlyStrategy: "percent",
    incomePercent: 55,
    spendPolicy: "flexible",
    sortOrder: 10,
  },
  {
    name: "Tự do tài chính",
    slug: "ffa",
    color: "#16A34A",
    icon: "trending-up",
    jarType: "investment",
    monthlyStrategy: "percent",
    incomePercent: 10,
    spendPolicy: "invest_only",
    sortOrder: 20,
  },
  {
    name: "Tiết kiệm dài hạn",
    slug: "lts",
    color: "#7C3AED",
    icon: "piggy-bank",
    jarType: "long_term_saving",
    monthlyStrategy: "percent",
    incomePercent: 10,
    spendPolicy: "long_term_only",
    sortOrder: 30,
  },
  {
    name: "Giáo dục",
    slug: "education",
    color: "#0EA5E9",
    icon: "book-open",
    jarType: "education",
    monthlyStrategy: "percent",
    incomePercent: 10,
    spendPolicy: "flexible",
    sortOrder: 40,
  },
  {
    name: "Hưởng thụ",
    slug: "play",
    color: "#F59E0B",
    icon: "party-popper",
    jarType: "play",
    monthlyStrategy: "percent",
    incomePercent: 10,
    spendPolicy: "must_spend",
    sortOrder: 50,
  },
  {
    name: "Cho đi",
    slug: "give",
    color: "#DC2626",
    icon: "heart-handshake",
    jarType: "give",
    monthlyStrategy: "percent",
    incomePercent: 5,
    spendPolicy: "give_only",
    sortOrder: 60,
  },
];

export type JarSuggestion = {
  jarId: string;
  jarName: string;
  amount: number;
  reason: string;
};

export type JarReviewRow = {
  id: string;
  source_type: string;
  source_id: string;
  movement_date: string;
  month: string;
  amount: number;
  status: "pending" | "resolved" | "dismissed";
  suggested_allocations: JarSuggestion[];
  context_json: Record<string, unknown>;
  resolved_allocations: JarSuggestion[] | null;
};

type JarRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  jar_type: string;
  monthly_strategy: string;
  spend_policy: string;
  sort_order: number;
  is_archived: boolean;
  goal_id: string | null;
};

type JarPlanRow = {
  jar_id: string;
  month: string;
  fixed_amount: number;
  income_percent: number;
};

type JarCurrentBalanceRow = {
  jar_id: string;
  total_inflow: number;
  total_outflow: number;
  current_balance: number;
  held_in_cash: number;
  held_in_savings: number;
  held_in_investments: number;
  held_in_assets: number;
};

type JarMonthlyBalanceRow = {
  jar_id: string;
  month: string;
  inflow_amount: number;
  outflow_amount: number;
  net_change: number;
  fixed_target_amount: number;
  income_percent_target: number;
};

function toMonthStart(dateValue: string | Date) {
  const date = dateValue instanceof Date ? dateValue : new Date(`${dateValue}T00:00:00.000Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function slugifyJarName(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeSuggestions(value: unknown): JarSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const jarId = String(row.jarId ?? row.jar_id ?? "");
      const jarName = String(row.jarName ?? row.jar_name ?? "");
      const amount = Math.round(Number(row.amount ?? 0));
      const reason = String(row.reason ?? "");
      if (!jarId || amount <= 0) return null;
      return { jarId, jarName, amount, reason };
    })
    .filter((item): item is JarSuggestion => Boolean(item));
}

export async function ensureJarPreset(
  supabase: SupabaseClient,
  householdId: string,
  userId: string,
) {
  const insertRows = JAR_PRESET_6.map((jar) => ({
    household_id: householdId,
    name: jar.name,
    slug: jar.slug,
    color: jar.color,
    icon: jar.icon,
    jar_type: jar.jarType,
    monthly_strategy: jar.monthlyStrategy,
    spend_policy: jar.spendPolicy,
    sort_order: jar.sortOrder,
    created_by: userId,
  }));

  const jarsUpsert = await supabase
    .from("jars")
    .upsert(insertRows, { onConflict: "household_id,slug", ignoreDuplicates: true });
  if (jarsUpsert.error) throw new Error(jarsUpsert.error.message);

  const month = toMonthStart(new Date());
  const jarsResult = await supabase
    .from("jars")
    .select("id, slug")
    .eq("household_id", householdId)
    .in(
      "slug",
      JAR_PRESET_6.map((jar) => jar.slug),
    );
  if (jarsResult.error) throw new Error(jarsResult.error.message);

  const jarIdBySlug = new Map((jarsResult.data ?? []).map((row) => [row.slug, row.id]));
  const planRows = JAR_PRESET_6.map((jar) => ({
    household_id: householdId,
    jar_id: jarIdBySlug.get(jar.slug),
    month,
    fixed_amount: 0,
    income_percent: jar.incomePercent,
    created_by: userId,
  })).filter((row) => row.jar_id);

  if (planRows.length > 0) {
    const plansUpsert = await supabase
      .from("jar_month_plans")
      .upsert(planRows, { onConflict: "jar_id,month" });
    if (plansUpsert.error) throw new Error(plansUpsert.error.message);
  }
}

export async function fetchJarCommandCenter(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
) {
  const monthStart = toMonthStart(month);
  const [jarsResult, plansResult, currentResult, monthlyResult, reviewResult, categoryRulesResult] =
    await Promise.all([
      supabase
        .from("jars")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("jar_month_plans")
        .select("jar_id, month, fixed_amount, income_percent")
        .eq("household_id", householdId)
        .eq("month", monthStart),
      supabase
        .from("jar_current_balances")
        .select("*")
        .eq("household_id", householdId),
      supabase
        .from("jar_balances_monthly")
        .select("*")
        .eq("household_id", householdId)
        .eq("month", monthStart),
      supabase
        .from("jar_review_queue")
        .select("*")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("jar_rules")
        .select("id")
        .eq("household_id", householdId)
        .eq("rule_type", "expense_category")
        .eq("is_active", true),
    ]);

  if (jarsResult.error) throw new Error(jarsResult.error.message);
  if (plansResult.error) throw new Error(plansResult.error.message);
  if (currentResult.error) throw new Error(currentResult.error.message);
  if (monthlyResult.error) throw new Error(monthlyResult.error.message);
  if (reviewResult.error) throw new Error(reviewResult.error.message);
  if (categoryRulesResult.error) throw new Error(categoryRulesResult.error.message);

  const jars = (jarsResult.data ?? []) as JarRow[];
  const planMap = new Map(
    ((plansResult.data ?? []) as JarPlanRow[]).map((row) => [row.jar_id, row]),
  );
  const currentMap = new Map(
    ((currentResult.data ?? []) as JarCurrentBalanceRow[]).map((row) => [row.jar_id, row]),
  );
  const monthlyMap = new Map(
    ((monthlyResult.data ?? []) as JarMonthlyBalanceRow[]).map((row) => [row.jar_id, row]),
  );

  const reviews = ((reviewResult.data ?? []) as Array<Record<string, unknown>>).map(
    (row) =>
      ({
        id: String(row.id),
        source_type: String(row.source_type),
        source_id: String(row.source_id),
        movement_date: String(row.movement_date),
        month: String(row.month),
        amount: Math.round(Number(row.amount ?? 0)),
        status: String(row.status) as JarReviewRow["status"],
        suggested_allocations: normalizeSuggestions(row.suggested_allocations),
        context_json:
          row.context_json && typeof row.context_json === "object"
            ? (row.context_json as Record<string, unknown>)
            : {},
        resolved_allocations: normalizeSuggestions(row.resolved_allocations),
      }) satisfies JarReviewRow,
  );

  const items = jars.map((jar) => {
    const plan = planMap.get(jar.id);
    const current = currentMap.get(jar.id);
    const monthly = monthlyMap.get(jar.id);
    const monthlyTarget =
      Math.round(Number(plan?.fixed_amount ?? 0)) || 0;

    return {
      ...jar,
      monthlyTarget,
      monthlyIncomePercent: Number(plan?.income_percent ?? 0),
      currentBalance: Math.round(Number(current?.current_balance ?? 0)),
      monthInflow: Math.round(Number(monthly?.inflow_amount ?? 0)),
      monthOutflow: Math.round(Number(monthly?.outflow_amount ?? 0)),
      heldInCash: Math.round(Number(current?.held_in_cash ?? 0)),
      heldInSavings: Math.round(Number(current?.held_in_savings ?? 0)),
      heldInInvestments: Math.round(Number(current?.held_in_investments ?? 0)),
      heldInAssets: Math.round(Number(current?.held_in_assets ?? 0)),
    };
  });

  return {
    monthStart,
    items,
    reviews,
    summary: {
      totalBalance: items.reduce((sum, item) => sum + item.currentBalance, 0),
      totalMonthInflow: items.reduce((sum, item) => sum + item.monthInflow, 0),
      totalMonthOutflow: items.reduce((sum, item) => sum + item.monthOutflow, 0),
      totalHeldInSavings: items.reduce((sum, item) => sum + item.heldInSavings, 0),
      totalHeldInInvestments: items.reduce((sum, item) => sum + item.heldInInvestments, 0),
      totalHeldInAssets: items.reduce((sum, item) => sum + item.heldInAssets, 0),
      pendingReviews: reviews.length,
      mappedExpenseRules: (categoryRulesResult.data ?? []).length,
    },
  };
}

export async function getExpenseRuleJarId(
  supabase: SupabaseClient,
  householdId: string,
  categoryId: string | null,
) {
  if (!categoryId) return null;
  const result = await supabase
    .from("jar_rules")
    .select("jar_id")
    .eq("household_id", householdId)
    .eq("rule_type", "expense_category")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data?.jar_id ?? null;
}

export async function computeIncomeAllocationSuggestions(
  supabase: SupabaseClient,
  householdId: string,
  amount: number,
  movementDate: string,
) {
  const month = toMonthStart(movementDate);
  const [plansResult, jarsResult, balancesResult] = await Promise.all([
    supabase
      .from("jar_month_plans")
      .select("jar_id, fixed_amount, income_percent")
      .eq("household_id", householdId)
      .eq("month", month),
    supabase
      .from("jars")
      .select("id, name")
      .eq("household_id", householdId)
      .eq("is_archived", false),
    supabase
      .from("jar_balances_monthly")
      .select("jar_id, inflow_amount")
      .eq("household_id", householdId)
      .eq("month", month),
  ]);
  if (plansResult.error) throw new Error(plansResult.error.message);
  if (jarsResult.error) throw new Error(jarsResult.error.message);
  if (balancesResult.error) throw new Error(balancesResult.error.message);

  const jarNameMap = new Map((jarsResult.data ?? []).map((row) => [row.id, row.name]));
  const alreadyInflowMap = new Map(
    ((balancesResult.data ?? []) as Array<{ jar_id: string; inflow_amount: number }>).map(
      (row) => [row.jar_id, Math.round(Number(row.inflow_amount ?? 0))],
    ),
  );

  let remaining = Math.round(amount);
  const suggestions: JarSuggestion[] = [];
  const plans = (plansResult.data ?? []) as Array<{
    jar_id: string;
    fixed_amount: number;
    income_percent: number;
  }>;

  for (const plan of plans.filter((row) => Number(row.income_percent ?? 0) > 0)) {
    const suggested = Math.round((remaining * Number(plan.income_percent ?? 0)) / 100);
    if (suggested <= 0) continue;
    suggestions.push({
      jarId: plan.jar_id,
      jarName: jarNameMap.get(plan.jar_id) ?? "Jar",
      amount: suggested,
      reason: `Theo ty le ${Number(plan.income_percent ?? 0).toFixed(0)}%`,
    });
  }

  const percentAllocated = suggestions.reduce((sum, row) => sum + row.amount, 0);
  remaining = Math.max(0, Math.round(amount) - percentAllocated);

  for (const plan of plans.filter((row) => Number(row.fixed_amount ?? 0) > 0)) {
    const currentMonthInflow = alreadyInflowMap.get(plan.jar_id) ?? 0;
    const gap = Math.max(0, Math.round(Number(plan.fixed_amount ?? 0)) - currentMonthInflow);
    if (gap <= 0 || remaining <= 0) continue;
    const suggested = Math.min(gap, remaining);
    suggestions.push({
      jarId: plan.jar_id,
      jarName: jarNameMap.get(plan.jar_id) ?? "Jar",
      amount: suggested,
      reason: "Bo sung muc tieu thang",
    });
    remaining -= suggested;
  }

  return suggestions.filter((row) => row.amount > 0);
}

export async function upsertJarReviewQueue(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    sourceType: string;
    sourceId: string;
    movementDate: string;
    amount: number;
    suggestedAllocations?: JarSuggestion[];
    contextJson?: Record<string, unknown>;
  },
) {
  const result = await supabase
    .from("jar_review_queue")
    .upsert(
      {
        household_id: input.householdId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        movement_date: input.movementDate,
        month: toMonthStart(input.movementDate),
        amount: Math.round(input.amount),
        suggested_allocations: input.suggestedAllocations ?? [],
        context_json: input.contextJson ?? {},
        status: "pending",
      },
      { onConflict: "household_id,source_type,source_id" },
    )
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Failed to queue jar review.");
  }

  return result.data.id;
}

export async function createJarMovement(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    jarId: string;
    movementDate: string;
    amount: number;
    balanceDelta: -1 | 0 | 1;
    locationFrom?: "external" | "cash" | "savings" | "investment" | "asset" | "expense" | null;
    locationTo?: "external" | "cash" | "savings" | "investment" | "asset" | "expense" | null;
    sourceType:
      | "income_transaction"
      | "expense_transaction"
      | "transfer_transaction"
      | "savings_create"
      | "savings_withdraw"
      | "savings_mature"
      | "asset_buy"
      | "asset_sell"
      | "investment_buy"
      | "investment_sell"
      | "manual_adjustment";
    sourceId: string;
    sourceLineKey?: string;
    relatedTransactionId?: string | null;
    relatedSavingsId?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown>;
    createdBy?: string | null;
    reviewQueueId?: string | null;
  },
) {
  const result = await supabase
    .from("jar_movements")
    .upsert(
      {
        household_id: input.householdId,
        jar_id: input.jarId,
        review_queue_id: input.reviewQueueId ?? null,
        movement_date: input.movementDate,
        month: toMonthStart(input.movementDate),
        amount: Math.round(input.amount),
        balance_delta: input.balanceDelta,
        location_from: input.locationFrom ?? null,
        location_to: input.locationTo ?? null,
        source_type: input.sourceType,
        source_id: input.sourceId,
        source_line_key: input.sourceLineKey ?? "default",
        related_transaction_id: input.relatedTransactionId ?? null,
        related_savings_id: input.relatedSavingsId ?? null,
        note: input.note ?? null,
        metadata: input.metadata ?? {},
        created_by: input.createdBy ?? null,
      },
      { onConflict: "household_id,jar_id,source_type,source_id,source_line_key" },
    )
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Failed to create jar movement.");
  }

  return result.data.id;
}

export async function syncTransactionToJarIntent(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    transactionId: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    transactionDate: string;
    categoryId: string | null;
    description?: string | null;
  },
) {
  if (input.type === "expense") {
    const jarId = await getExpenseRuleJarId(
      supabase,
      input.householdId,
      input.categoryId,
    );
    if (jarId) {
      await createJarMovement(supabase, {
        householdId: input.householdId,
        jarId,
        movementDate: input.transactionDate,
        amount: input.amount,
        balanceDelta: -1,
        locationFrom: "cash",
        locationTo: "expense",
        sourceType: "expense_transaction",
        sourceId: input.transactionId,
        relatedTransactionId: input.transactionId,
        note: input.description ?? null,
        createdBy: input.userId,
      });
      return { queued: false };
    }

    await upsertJarReviewQueue(supabase, {
      householdId: input.householdId,
      sourceType: "expense_transaction",
      sourceId: input.transactionId,
      movementDate: input.transactionDate,
      amount: input.amount,
      contextJson: {
        transactionType: input.type,
        categoryId: input.categoryId,
        description: input.description ?? null,
      },
    });
    return { queued: true };
  }

  if (input.type === "income") {
    const suggestions = await computeIncomeAllocationSuggestions(
      supabase,
      input.householdId,
      input.amount,
      input.transactionDate,
    );
    await upsertJarReviewQueue(supabase, {
      householdId: input.householdId,
      sourceType: "income_transaction",
      sourceId: input.transactionId,
      movementDate: input.transactionDate,
      amount: input.amount,
      suggestedAllocations: suggestions,
      contextJson: {
        transactionType: input.type,
        categoryId: input.categoryId,
        description: input.description ?? null,
      },
    });
    return { queued: true };
  }

  return { queued: false };
}

export async function syncSavingsCreateToJarIntent(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    savingsId: string;
    amount: number;
    movementDate: string;
    providerName: string;
    sourceJarId?: string | null;
  },
) {
  if (input.sourceJarId) {
    await createJarMovement(supabase, {
      householdId: input.householdId,
      jarId: input.sourceJarId,
      movementDate: input.movementDate,
      amount: input.amount,
      balanceDelta: 0,
      locationFrom: "cash",
      locationTo: "savings",
      sourceType: "savings_create",
      sourceId: input.savingsId,
      relatedSavingsId: input.savingsId,
      note: `Savings create: ${input.providerName}`,
      createdBy: input.userId,
    });
    return { queued: false };
  }

  await upsertJarReviewQueue(supabase, {
    householdId: input.householdId,
    sourceType: "savings_create",
    sourceId: input.savingsId,
    movementDate: input.movementDate,
    amount: input.amount,
    contextJson: {
      providerName: input.providerName,
      needs: "source_jar",
    },
  });
  return { queued: true };
}

export async function syncSavingsReleaseToJarIntent(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    userId: string;
    sourceType: "savings_withdraw" | "savings_mature";
    sourceId: string;
    savingsId: string;
    movementDate: string;
    providerName: string;
    principalAmount: number;
    interestAmount: number;
    taxAmount: number;
    destinationJarId?: string | null;
  },
) {
  if (input.destinationJarId) {
    await createJarMovement(supabase, {
      householdId: input.householdId,
      jarId: input.destinationJarId,
      movementDate: input.movementDate,
      amount: input.principalAmount,
      balanceDelta: 0,
      locationFrom: "savings",
      locationTo: "cash",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceLineKey: "principal",
      relatedSavingsId: input.savingsId,
      note: `Savings principal release: ${input.providerName}`,
      createdBy: input.userId,
    });
    if (input.interestAmount > 0) {
      await createJarMovement(supabase, {
        householdId: input.householdId,
        jarId: input.destinationJarId,
        movementDate: input.movementDate,
        amount: input.interestAmount,
        balanceDelta: 1,
        locationFrom: "external",
        locationTo: "cash",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceLineKey: "interest",
        relatedSavingsId: input.savingsId,
        note: `Savings interest: ${input.providerName}`,
        createdBy: input.userId,
      });
    }
    if (input.taxAmount > 0) {
      await createJarMovement(supabase, {
        householdId: input.householdId,
        jarId: input.destinationJarId,
        movementDate: input.movementDate,
        amount: input.taxAmount,
        balanceDelta: -1,
        locationFrom: "cash",
        locationTo: "external",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceLineKey: "tax",
        relatedSavingsId: input.savingsId,
        note: `Savings tax: ${input.providerName}`,
        createdBy: input.userId,
      });
    }
    return { queued: false };
  }

  await upsertJarReviewQueue(supabase, {
    householdId: input.householdId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    movementDate: input.movementDate,
    amount: input.principalAmount + input.interestAmount,
    contextJson: {
      providerName: input.providerName,
      principalAmount: input.principalAmount,
      interestAmount: input.interestAmount,
      taxAmount: input.taxAmount,
      savingsId: input.savingsId,
      needs: "destination_jar",
    },
  });
  return { queued: true };
}

export async function resolveJarReviewQueue(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    reviewId: string;
    userId: string;
    allocations: Array<{ jarId: string; amount: number }>;
  },
) {
    const reviewResult = await supabase
      .from("jar_review_queue")
      .select("*")
      .eq("household_id", input.householdId)
      .eq("id", input.reviewId)
      .maybeSingle();

    if (reviewResult.error || !reviewResult.data) {
      throw new Error(reviewResult.error?.message ?? "Review item not found.");
    }

    const review = reviewResult.data as Record<string, unknown>;
    const sourceType = String(review.source_type);
    const sourceId = String(review.source_id);
    const movementDate = String(review.movement_date);
    const context =
      review.context_json && typeof review.context_json === "object"
        ? (review.context_json as Record<string, unknown>)
        : {};

    const normalizedAllocations = input.allocations
      .map((row) => ({
        jarId: row.jarId,
        amount: Math.round(Number(row.amount ?? 0)),
      }))
      .filter((row) => row.jarId && row.amount > 0);

    if (normalizedAllocations.length === 0) {
      throw new Error("At least one jar allocation is required.");
    }

    for (const [index, allocation] of normalizedAllocations.entries()) {
      if (sourceType === "income_transaction") {
        await createJarMovement(supabase, {
          householdId: input.householdId,
          jarId: allocation.jarId,
          movementDate,
          amount: allocation.amount,
          balanceDelta: 1,
          locationFrom: "external",
          locationTo: "cash",
          sourceType: "income_transaction",
          sourceId,
          sourceLineKey: `alloc-${index}`,
          relatedTransactionId: sourceId,
          note: String(context.description ?? "Income allocation"),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        });
      } else if (sourceType === "expense_transaction") {
        await createJarMovement(supabase, {
          householdId: input.householdId,
          jarId: allocation.jarId,
          movementDate,
          amount: allocation.amount,
          balanceDelta: -1,
          locationFrom: "cash",
          locationTo: "expense",
          sourceType: "expense_transaction",
          sourceId,
          sourceLineKey: `alloc-${index}`,
          relatedTransactionId: sourceId,
          note: String(context.description ?? "Expense allocation"),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        });
      } else if (sourceType === "savings_create") {
        await createJarMovement(supabase, {
          householdId: input.householdId,
          jarId: allocation.jarId,
          movementDate,
          amount: allocation.amount,
          balanceDelta: 0,
          locationFrom: "cash",
          locationTo: "savings",
          sourceType: "savings_create",
          sourceId,
          sourceLineKey: `alloc-${index}`,
          relatedSavingsId: String(context.savingsId ?? sourceId),
          note: String(context.providerName ?? "Savings create"),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        });
      } else if (sourceType === "savings_withdraw" || sourceType === "savings_mature") {
        const principalAmount = Math.round(Number(context.principalAmount ?? allocation.amount));
        const interestAmount = Math.round(Number(context.interestAmount ?? 0));
        const taxAmount = Math.round(Number(context.taxAmount ?? 0));
        await createJarMovement(supabase, {
          householdId: input.householdId,
          jarId: allocation.jarId,
          movementDate,
          amount: principalAmount,
          balanceDelta: 0,
          locationFrom: "savings",
          locationTo: "cash",
          sourceType: sourceType as "savings_withdraw" | "savings_mature",
          sourceId,
          sourceLineKey: `principal-${index}`,
          relatedSavingsId: String(context.savingsId ?? sourceId),
          note: String(context.providerName ?? "Savings release"),
          createdBy: input.userId,
          reviewQueueId: input.reviewId,
        });
        if (interestAmount > 0) {
          await createJarMovement(supabase, {
            householdId: input.householdId,
            jarId: allocation.jarId,
            movementDate,
            amount: interestAmount,
            balanceDelta: 1,
            locationFrom: "external",
            locationTo: "cash",
            sourceType: sourceType as "savings_withdraw" | "savings_mature",
            sourceId,
            sourceLineKey: `interest-${index}`,
            relatedSavingsId: String(context.savingsId ?? sourceId),
            note: `Savings interest ${String(context.providerName ?? "")}`.trim(),
            createdBy: input.userId,
            reviewQueueId: input.reviewId,
          });
        }
        if (taxAmount > 0) {
          await createJarMovement(supabase, {
            householdId: input.householdId,
            jarId: allocation.jarId,
            movementDate,
            amount: taxAmount,
            balanceDelta: -1,
            locationFrom: "cash",
            locationTo: "external",
            sourceType: sourceType as "savings_withdraw" | "savings_mature",
            sourceId,
            sourceLineKey: `tax-${index}`,
            relatedSavingsId: String(context.savingsId ?? sourceId),
            note: `Savings tax ${String(context.providerName ?? "")}`.trim(),
            createdBy: input.userId,
            reviewQueueId: input.reviewId,
          });
        }
      }
    }

    const update = await supabase
      .from("jar_review_queue")
      .update({
        status: "resolved",
        resolved_allocations: normalizedAllocations,
        resolved_by: input.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq("household_id", input.householdId)
      .eq("id", input.reviewId);

    if (update.error) throw new Error(update.error.message);
}
