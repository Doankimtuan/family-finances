"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

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
  interval: z.coerce.number().int().min(1).default(1),
  day_of_month: z.coerce.number().int().min(1).max(31).optional(),
  day_of_week: z.coerce.number().int().min(0).max(6).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_active: z.boolean().default(true),
});

export type RecurringRuleInput = z.infer<typeof RecurringRuleSchema>;

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

    // Calculate next_run_date based on frequency and day settings
    let nextRunDate = data.start_date;
    if (data.frequency === "monthly" && data.day_of_month) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const targetDay = Math.min(data.day_of_month, 28); // Avoid month-end issues
      nextRunDate = `${year}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
      if (new Date(nextRunDate) < today) {
        // Move to next month
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        nextRunDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
      }
    }

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
      error: err instanceof Error ? err.message : "Failed to create recurring rule",
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
      error: err instanceof Error ? err.message : "Failed to update recurring rule",
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
      error: err instanceof Error ? err.message : "Failed to delete recurring rule",
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
      error: err instanceof Error ? err.message : "Failed to toggle recurring rule",
    };
  }
}
