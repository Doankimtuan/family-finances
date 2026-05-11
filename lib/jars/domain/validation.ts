import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError, ValidationResult } from "./types";
import { toMonthStart } from "../_lib/utils";

export async function validateJarActive(
  supabase: SupabaseClient,
  householdId: string,
  jarId: string,
): Promise<ValidationResult> {
  const result = await supabase
    .from("jars")
    .select("id, is_archived, deleted_at")
    .eq("household_id", householdId)
    .eq("id", jarId)
    .maybeSingle();

  if (result.error || !result.data) {
    return {
      ok: false,
      errors: [{ code: "JAR_NOT_FOUND", message: "Jar not found." }],
    };
  }

  if (result.data.is_archived) {
    return {
      ok: false,
      errors: [{ code: "JAR_ARCHIVED", message: "Jar is archived." }],
    };
  }

  if (result.data.deleted_at) {
    return {
      ok: false,
      errors: [{ code: "JAR_DELETED", message: "Jar has been deleted." }],
    };
  }

  return { ok: true };
}

export async function validateMonthOpen(
  supabase: SupabaseClient,
  householdId: string,
  month: string,
): Promise<ValidationResult> {
  const monthStart = toMonthStart(month);

  const result = await supabase
    .from("jar_month_close_runs")
    .select("id, status")
    .eq("household_id", householdId)
    .eq("month", monthStart)
    .eq("status", "approved")
    .maybeSingle();

  if (result.data) {
    return {
      ok: false,
      errors: [
        {
          code: "MONTH_CLOSED",
          message: `Month ${monthStart} is closed. Use correction workflow.`,
        },
      ],
    };
  }

  return { ok: true };
}

export function validatePositiveAmount(amount: number): ValidationResult {
  if (amount <= 0) {
    return {
      ok: false,
      errors: [
        { code: "AMOUNT_NOT_POSITIVE", message: "Amount must be positive." },
      ],
    };
  }
  return { ok: true };
}

export function validateBalanceDelta(delta: number): ValidationResult {
  if (![-1, 0, 1].includes(delta)) {
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_BALANCE_DELTA",
          message: "balanceDelta must be -1, 0, or 1.",
        },
      ],
    };
  }
  return { ok: true };
}

export async function validateCategoryIsExpense(
  supabase: SupabaseClient,
  categoryId: string,
): Promise<ValidationResult> {
  const result = await supabase
    .from("categories")
    .select("kind")
    .eq("id", categoryId)
    .maybeSingle();

  if (result.error || !result.data) {
    return {
      ok: false,
      errors: [{ code: "CATEGORY_NOT_FOUND", message: "Category not found." }],
    };
  }

  if (result.data.kind !== "expense") {
    return {
      ok: false,
      errors: [
        {
          code: "CATEGORY_NOT_EXPENSE",
          message: "Category must be of kind 'expense'.",
        },
      ],
    };
  }

  return { ok: true };
}

export async function validateMovementCommand(
  supabase: SupabaseClient,
  input: {
    householdId: string;
    jarId: string;
    movementDate: string;
    amount: number;
    balanceDelta: number;
  },
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  const jarCheck = await validateJarActive(
    supabase,
    input.householdId,
    input.jarId,
  );
  if (!jarCheck.ok) errors.push(...jarCheck.errors);

  const monthCheck = await validateMonthOpen(
    supabase,
    input.householdId,
    input.movementDate,
  );
  if (!monthCheck.ok) errors.push(...monthCheck.errors);

  const amountCheck = validatePositiveAmount(input.amount);
  if (!amountCheck.ok) errors.push(...amountCheck.errors);

  const deltaCheck = validateBalanceDelta(input.balanceDelta);
  if (!deltaCheck.ok) errors.push(...deltaCheck.errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}

export function combineValidations(results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => (r.ok ? [] : r.errors));
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}
