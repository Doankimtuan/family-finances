import "server-only";

import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { periodMonthExclusiveEnd } from "../ritual-period";
import type {
  RitualDivergenceItem,
  RitualEmergencyItem,
} from "../ritual-types";

export class RitualGateQueryError extends Error {
  constructor(message = "Ritual gate query failed") {
    super(message);
    this.name = "RitualGateQueryError";
  }
}

/**
 * ST-E04-002 — categories used in the period without an active Jar binding.
 * Fail closed: query errors throw RitualGateQueryError.
 */
export async function listRitualDivergence(
  householdId: string,
  periodMonth: string,
): Promise<RitualDivergenceItem[]> {
  const supabase = await createSupabaseServerClient();
  const periodEnd = periodMonthExclusiveEnd(periodMonth);

  const { data: txRows, error } = await supabase
    .from("transactions")
    .select("category_id")
    .eq("household_id", householdId)
    .gte("transaction_date", periodMonth)
    .lt("transaction_date", periodEnd)
    .not("category_id", "is", null);

  if (error) throw new RitualGateQueryError(error.message);
  if (!txRows?.length) return [];

  const counts = new Map<string, number>();
  for (const row of txRows) {
    const categoryId = row.category_id as string | null;
    if (!categoryId) continue;
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
  }

  const categoryIds = [...counts.keys()];
  if (categoryIds.length === 0) return [];

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, jar_id")
    .in("id", categoryIds);

  if (catError || !categories) {
    throw new RitualGateQueryError(
      catError?.message ?? "categories query failed",
    );
  }

  const jarIds = categories
    .map((c) => c.jar_id as string | null)
    .filter((id): id is string => id != null);

  const archivedJarIds = new Set<string>();
  if (jarIds.length > 0) {
    const { data: jars, error: jarError } = await supabase
      .from("jars")
      .select("id, is_archived")
      .in("id", jarIds);
    if (jarError) throw new RitualGateQueryError(jarError.message);
    for (const jar of jars ?? []) {
      if (jar.is_archived) archivedJarIds.add(jar.id as string);
    }
  }

  const items: RitualDivergenceItem[] = [];
  for (const cat of categories) {
    const categoryId = cat.id as string;
    const jarId = cat.jar_id as string | null;
    const unbound = jarId == null || archivedJarIds.has(jarId);
    if (!unbound) continue;
    items.push({
      categoryId,
      categoryName: (cat.name as string) || categoryId,
      transactionCount: counts.get(categoryId) ?? 0,
    });
  }

  return items;
}

/**
 * ST-E04-003 — emergency plan movements in the ritual period.
 */
export async function listRitualEmergencies(
  householdId: string,
  periodMonth: string,
): Promise<RitualEmergencyItem[]> {
  const supabase = await createSupabaseServerClient();
  const periodEnd = periodMonthExclusiveEnd(periodMonth);
  const startIso = `${periodMonth}T00:00:00.000Z`;
  const endIso = `${periodEnd}T00:00:00.000Z`;

  const { data, error } = await supabase
    .from("plan_movements")
    .select("id, amount, intent_note, source_jar_id, target_jar_id, created_at")
    .eq("household_id", householdId)
    .eq("is_emergency", true)
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false });

  if (error) throw new RitualGateQueryError(error.message);
  if (!data) return [];

  return data.map((row) => ({
    id: row.id as string,
    amount: Number(row.amount) || 0,
    intentNote: (row.intent_note as string | null) ?? null,
    sourceJarId: row.source_jar_id as string,
    targetJarId: row.target_jar_id as string,
    createdAt: row.created_at as string,
  }));
}
