"use server";

import { revalidatePath } from "next/cache";
import { addDays, addMonths, format, getDay, getDaysInMonth, isBefore, parseISO, setDate } from "date-fns";
import { z } from "zod";

import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

const MIN_INTERVAL = 1;
const MIN_DAY_OF_MONTH = 1;
const MAX_DAY_OF_MONTH = 31;
const MIN_DAY_OF_WEEK = 0;
const MAX_DAY_OF_WEEK = 6;
const MAX_SAFE_DAY_OF_MONTH = 28;
const MAX_MONTH_LOOKAHEAD = 240;
const DATE_ONLY_FORMAT = "yyyy-MM-dd";
const ERROR_MONTHLY_DAY_REQUIRED = "Monthly recurring rules require day_of_month.";
const ERROR_WEEKLY_DAY_REQUIRED = "Weekly recurring rules require day_of_week.";
const ERROR_CREATE_RECURRING_RULE = "Failed to create recurring rule";
const ERROR_UPDATE_RECURRING_RULE = "Failed to update recurring rule";
const ERROR_DELETE_RECURRING_RULE = "Failed to delete recurring rule";
const ERROR_TOGGLE_RECURRING_RULE = "Failed to toggle recurring rule";

const RecurringRuleSchema = z.object({
  id: z.string().uuid().optional(),
  template: z.object({
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive(),
    description: z.string().min(1).max(200),
    account_id: z.string().uuid(),
    category_id: z.string().uuid().optional(),
  }),
  frequency: z.enum(["weekly", "monthly"]),
  interval: z.coerce.number().int().min(MIN_INTERVAL).default(MIN_INTERVAL),
  day_of_month: z.coerce.number().int().min(MIN_DAY_OF_MONTH).max(MAX_DAY_OF_MONTH).optional(),
  day_of_week: z.coerce.number().int().min(MIN_DAY_OF_WEEK).max(MAX_DAY_OF_WEEK).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_active: z.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.frequency === "monthly" && value.day_of_month === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["day_of_month"],
      message: ERROR_MONTHLY_DAY_REQUIRED,
    });
  }

  if (value.frequency === "weekly" && value.day_of_week === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["day_of_week"],
      message: ERROR_WEEKLY_DAY_REQUIRED,
    });
  }
});

export type RecurringRuleInput = z.infer<typeof RecurringRuleSchema>;

function computeNextRunDate(data: RecurringRuleInput): string {
  const startDate = parseISO(data.start_date);

  if (data.frequency === "monthly" && data.day_of_month !== undefined) {
    const targetDay = Math.min(data.day_of_month, MAX_SAFE_DAY_OF_MONTH);
    const interval = Math.max(data.interval, MIN_INTERVAL);

    for (let monthOffset = 0; monthOffset <= MAX_MONTH_LOOKAHEAD; monthOffset += 1) {
      if (monthOffset % interval !== 0) continue;

      const monthCursor = addMonths(startDate, monthOffset);
      const dayInMonth = Math.min(targetDay, getDaysInMonth(monthCursor));
      const candidate = setDate(monthCursor, dayInMonth);

      if (!isBefore(candidate, startDate)) {
        return format(candidate, DATE_ONLY_FORMAT);
      }
    }
  }

  if (data.frequency === "weekly" && data.day_of_week !== undefined) {
    let candidate = startDate;
    while (getDay(candidate) !== data.day_of_week) {
      candidate = addDays(candidate, 1);
    }
    return format(candidate, DATE_ONLY_FORMAT);
  }

  return data.start_date;
}

export async function createRecurringRule(
  prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string; ruleId?: string }> {
  try {
    const { householdId } = await getAuthenticatedHouseholdContext();
    const supabase = await createClient();

    const rawData = {
      template: {
        type: formData.get("type"),
        amount: formData.get("amount"),
        description: formData.get("description"),
        account_id: formData.get("account_id"),
        category_id: formData.get("category_id") || undefined,
      },
      frequency: formData.get("frequency"),
      interval: formData.get("interval") || 1,
      day_of_month: formData.get("day_of_month") || undefined,
      day_of_week: formData.get("day_of_week") || undefined,
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date") || undefined,
      is_active: formData.get("is_active") === "true",
    };

    const validated = RecurringRuleSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((e) => e.message).join(", "),
      };
    }

    const data = validated.data;

    const nextRunDate = computeNextRunDate(data);

    const { data: result, error } = await supabase
      .from("recurring_rules")
      .insert({
        household_id: householdId,
        template_json: data.template,
        frequency: data.frequency,
        interval: data.interval,
        day_of_month: data.day_of_month,
        day_of_week: data.day_of_week,
        start_date: data.start_date,
        end_date: data.end_date || null,
        next_run_date: nextRunDate,
        is_active: data.is_active,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/recurring");
    revalidatePath("/activity");
    return { success: true, ruleId: result.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_CREATE_RECURRING_RULE,
    };
  }
}

export async function updateRecurringRule(
  prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { householdId } = await getAuthenticatedHouseholdContext();
    const supabase = await createClient();

    const id = formData.get("id") as string;
    if (!id) {
      return { success: false, error: "Rule ID is required" };
    }

    const rawData = {
      template: {
        type: formData.get("type"),
        amount: formData.get("amount"),
        description: formData.get("description"),
        account_id: formData.get("account_id"),
        category_id: formData.get("category_id") || undefined,
      },
      frequency: formData.get("frequency"),
      interval: formData.get("interval") || 1,
      day_of_month: formData.get("day_of_month") || undefined,
      day_of_week: formData.get("day_of_week") || undefined,
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date") || undefined,
      is_active: formData.get("is_active") === "true",
    };

    const validated = RecurringRuleSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map((e) => e.message).join(", "),
      };
    }

    const data = validated.data;
    const nextRunDate = computeNextRunDate(data);

    const { error } = await supabase
      .from("recurring_rules")
      .update({
        template_json: data.template,
        frequency: data.frequency,
        interval: data.interval,
        day_of_month: data.day_of_month,
        day_of_week: data.day_of_week,
        start_date: data.start_date,
        end_date: data.end_date || null,
        next_run_date: nextRunDate,
        is_active: data.is_active,
      })
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/recurring");
    revalidatePath("/activity");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_UPDATE_RECURRING_RULE,
    };
  }
}

export async function deleteRecurringRule(
  prevState: unknown,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { householdId } = await getAuthenticatedHouseholdContext();
    const supabase = await createClient();

    const id = formData.get("id") as string;
    if (!id) {
      return { success: false, error: "Rule ID is required" };
    }

    const { error } = await supabase
      .from("recurring_rules")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/recurring");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_DELETE_RECURRING_RULE,
    };
  }
}

export async function toggleRecurringRule(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { householdId } = await getAuthenticatedHouseholdContext();
    const supabase = await createClient();

    const { error } = await supabase
      .from("recurring_rules")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/recurring");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_TOGGLE_RECURRING_RULE,
    };
  }
}
