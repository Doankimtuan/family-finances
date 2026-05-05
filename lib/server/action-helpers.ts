import { revalidatePath as nextRevalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Re-export revalidatePath for direct use when needed
export { nextRevalidatePath as revalidatePath };

/**
 * Shared helpers for Server Action responses.
 *
 * Usage:
 *   import { ok, fail, resolveActionContext, revalidateDashboard } from "@/lib/server/action-helpers";
 *   return ok("Transaction deleted.");
 *   return fail("Insufficient balance.");
 *   revalidateDashboard();
 *
 * For domain-specific extra fields, extend ActionState<T>:
 *   type TransactionState = ActionState<{ spendingJarWarning?: ... }>;
 */

/** Base action state type — status + message. */
export type ActionState<TExtra extends object = Record<string, never>> = {
  status: "idle" | "success" | "error";
  message: string;
} & TExtra;

/** Generic initial state for useActionState / useFormState hooks. */
export function initialActionState<
  TExtra extends object = Record<string, never>,
>(extra?: TExtra): ActionState<TExtra> {
  return { status: "idle", message: "", ...(extra ?? ({} as TExtra)) };
}

/** Creates a success response. */
export function ok<TExtra extends object = Record<string, never>>(
  message: string,
  extra?: TExtra,
): ActionState<TExtra> {
  return { status: "success", message, ...(extra ?? ({} as TExtra)) };
}

/** Creates an error response. */
export function fail<TExtra extends object = Record<string, never>>(
  message: string,
  extra?: TExtra,
): ActionState<TExtra> {
  return { status: "error", message, ...(extra ?? ({} as TExtra)) };
}

/** Context for server actions - auth user and household resolution. */
export type ActionContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string } | null;
  householdId: string | null;
  error: string | null;
};

/**
 * Resolves the authenticated user and their active household.
 * Returns context object with supabase client, user, householdId, and optional error.
 */
export async function resolveActionContext(): Promise<ActionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, householdId: null, error: "You must be logged in." };
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error) {
    return {
      supabase,
      user,
      householdId: null,
      error: `Failed to resolve household: ${membership.error.message}`,
    };
  }

  if (!membership.data?.household_id) {
    return { supabase, user, householdId: null, error: "No household found." };
  }

  return { supabase, user, householdId: membership.data.household_id, error: null };
}

/**
 * Domain-specific revalidation helpers.
 * These consolidate common revalidatePath patterns across actions.
 */

/** Revalidates dashboard and related pages after data changes. */
export function revalidateDashboard(): void {
  nextRevalidatePath("/dashboard");
}

/** Revalidates categories-related pages. */
export function revalidateCategories(): void {
  nextRevalidatePath("/categories");
  nextRevalidatePath("/activity");
}

/** Revalidates categories with settings page. */
export function revalidateCategoriesWithSettings(): void {
  nextRevalidatePath("/categories");
  nextRevalidatePath("/settings/categories");
  nextRevalidatePath("/activity");
}

/** Revalidates goals-related pages. */
export function revalidateGoals(): void {
  nextRevalidatePath("/goals");
  nextRevalidatePath("/dashboard");
}

/** Revalidates goals with transactions and accounts. */
export function revalidateGoalsFull(): void {
  nextRevalidatePath("/goals");
  nextRevalidatePath("/dashboard");
  nextRevalidatePath("/activity");
  nextRevalidatePath("/accounts");
}

/** Revalidates jars-related pages. */
export function revalidateJars(): void {
  nextRevalidatePath("/goals");
  nextRevalidatePath("/dashboard");
}

/** Revalidates jars for a specific month. */
export function revalidateJarsMonth(month: string): void {
  nextRevalidatePath(`/goals?tab=jars&month=${month}`);
  nextRevalidatePath("/dashboard");
}

/** Revalidates transactions and dashboard. */
export function revalidateTransactions(): void {
  nextRevalidatePath("/activity");
  nextRevalidatePath("/dashboard");
}

/** Revalidates transactions, dashboard, and accounts. */
export function revalidateTransactionsFull(): void {
  nextRevalidatePath("/activity");
  nextRevalidatePath("/dashboard");
  nextRevalidatePath("/accounts");
}

/** Revalidates assets pages. */
export function revalidateAssets(assetId?: string): void {
  nextRevalidatePath("/assets");
  if (assetId) {
    nextRevalidatePath(`/assets/${assetId}`);
  }
}

/** Revalidates accounts pages. */
export function revalidateMoney(): void {
  nextRevalidatePath("/accounts");
  nextRevalidatePath("/activity");
}

/** Revalidates settings pages. */
export function revalidateSettings(): void {
  nextRevalidatePath("/settings");
}

/** Revalidates settings profile page. */
export function revalidateSettingsProfile(): void {
  nextRevalidatePath("/settings/profile");
  nextRevalidatePath("/settings");
}

/** Revalidates settings household page. */
export function revalidateSettingsHousehold(): void {
  nextRevalidatePath("/settings/household");
  nextRevalidatePath("/settings");
  nextRevalidatePath("/household");
}

/** Revalidates settings assumptions page. */
export function revalidateSettingsAssumptions(): void {
  nextRevalidatePath("/settings/assumptions");
  nextRevalidatePath("/settings");
  nextRevalidatePath("/dashboard");
  nextRevalidatePath("/decision-tools");
}

/** Revalidates onboarding pages. */
export function revalidateOnboarding(step?: string): void {
  if (step) {
    nextRevalidatePath(`/onboarding/${step}`);
  } else {
    nextRevalidatePath("/onboarding");
  }
}
