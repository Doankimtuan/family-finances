"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

import type { OnboardingActionState } from "./action-types";

function ok(message: string): OnboardingActionState {
  return { status: "success", message };
}

function fail(message: string): OnboardingActionState {
  return { status: "error", message };
}

async function resolveUserAndHousehold() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
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

  if (membership.error || !membership.data?.household_id) {
    return { supabase, user, householdId: null, error: membership.error?.message ?? "No household found." };
  }

  return { supabase, user, householdId: membership.data.household_id, error: null };
}

export async function saveWelcomeAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const householdName = String(formData.get("householdName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Ho_Chi_Minh").trim() || "Asia/Ho_Chi_Minh";

  if (householdName.length < 2) {
    return fail("Household name must be at least 2 characters.");
  }

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const update = await supabase
    .from("households")
    .update({ name: householdName, locale: "en-US", timezone })
    .eq("id", householdId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.welcome_saved",
    entityType: "household",
    entityId: householdId,
    payload: { householdName, timezone },
  });

  revalidatePath("/onboarding");
  return ok("Welcome details saved.");
}

export async function inviteMemberOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email.includes("@")) {
    return fail("Enter a valid email address.");
  }

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const invite = await supabase
    .from("household_invitations")
    .insert({
      household_id: householdId,
      email,
      invited_by: user.id,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("token")
    .single();

  if (invite.error) return fail(invite.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.member_invited",
    entityType: "household_invitation",
    payload: { email },
  });

  revalidatePath("/onboarding/members");
  return ok(`Invitation token created: ${invite.data.token}`);
}

export async function addAccountOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "checking").trim();
  const openingBalance = Number(formData.get("openingBalance") ?? 0);

  if (name.length < 2) return fail("Account name must be at least 2 characters.");
  if (!Number.isFinite(openingBalance) || openingBalance < 0) return fail("Opening balance must be a non-negative number.");

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const openingBalanceRounded = Math.round(openingBalance);
  const insert = await supabase
    .from("accounts")
    .insert({
      household_id: householdId,
      name,
      type,
      opening_balance: openingBalanceRounded,
      opening_balance_date: new Date().toISOString().slice(0, 10),
      include_in_net_worth: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to add account.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.account_added",
    entityType: "account",
    entityId: insert.data.id,
    payload: { name, type, openingBalance: openingBalanceRounded },
  });

  revalidatePath("/onboarding/accounts");
  return ok("Account added.");
}

export async function addAssetOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const assetClass = String(formData.get("assetClass") ?? "gold").trim();
  const unitLabel = String(formData.get("unitLabel") ?? "unit").trim() || "unit";
  const quantity = Number(formData.get("quantity") ?? 0);
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  const isLiquid = String(formData.get("isLiquid") ?? "false") === "true";

  if (name.length < 2) return fail("Asset name must be at least 2 characters.");
  if (!Number.isFinite(quantity) || quantity < 0) return fail("Quantity must be non-negative.");
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return fail("Unit price must be non-negative.");

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const today = new Date().toISOString().slice(0, 10);

  const assetInsert = await supabase
    .from("assets")
    .insert({
      household_id: householdId,
      name,
      asset_class: assetClass,
      unit_label: unitLabel,
      quantity,
      acquisition_date: today,
      acquisition_cost: Math.round(quantity * unitPrice),
      is_liquid: isLiquid,
      include_in_net_worth: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (assetInsert.error || !assetInsert.data?.id) return fail(assetInsert.error?.message ?? "Failed to add asset.");

  const assetId = assetInsert.data.id;

  const [qInsert, pInsert] = await Promise.all([
    supabase.from("asset_quantity_history").insert({
      asset_id: assetId,
      household_id: householdId,
      as_of_date: today,
      quantity,
      source: "manual",
      created_by: user.id,
    }),
    supabase.from("asset_price_history").insert({
      asset_id: assetId,
      household_id: householdId,
      as_of_date: today,
      unit_price: Math.round(unitPrice),
      price_currency: "VND",
      source: "manual",
      created_by: user.id,
    }),
  ]);

  if (qInsert.error) return fail(qInsert.error.message);
  if (pInsert.error) return fail(pInsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.asset_added",
    entityType: "asset",
    entityId: assetId,
    payload: { name, assetClass, quantity, unitPrice: Math.round(unitPrice), isLiquid },
  });

  revalidatePath("/onboarding/assets");
  return ok("Asset added with initial valuation.");
}

export async function addDebtOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const liabilityType = String(formData.get("liabilityType") ?? "mortgage").trim();
  const principalOriginal = Number(formData.get("principalOriginal") ?? 0);
  const currentOutstanding = Number(formData.get("currentOutstanding") ?? 0);
  const annualRate = Number(formData.get("annualRate") ?? 0);
  const repaymentMethod = String(formData.get("repaymentMethod") ?? "annuity").trim();

  if (name.length < 2) return fail("Debt name must be at least 2 characters.");
  if (!Number.isFinite(principalOriginal) || principalOriginal <= 0) return fail("Original principal must be positive.");
  if (!Number.isFinite(currentOutstanding) || currentOutstanding < 0) return fail("Current outstanding must be non-negative.");
  if (!Number.isFinite(annualRate) || annualRate < 0) return fail("Rate must be non-negative.");

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const today = new Date().toISOString().slice(0, 10);

  const liabilityInsert = await supabase
    .from("liabilities")
    .insert({
      household_id: householdId,
      name,
      liability_type: liabilityType,
      lender_name: "Manual Entry",
      principal_original: Math.round(principalOriginal),
      start_date: today,
      repayment_method: repaymentMethod,
      current_principal_outstanding: Math.round(currentOutstanding),
      promo_rate_annual: annualRate / 100,
      promo_months: 0,
      include_in_net_worth: true,
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (liabilityInsert.error || !liabilityInsert.data?.id) {
    return fail(liabilityInsert.error?.message ?? "Failed to add debt.");
  }

  const rateInsert = await supabase.from("liability_rate_periods").insert({
    liability_id: liabilityInsert.data.id,
    household_id: householdId,
    period_start: today,
    annual_rate: annualRate / 100,
    is_promotional: false,
    created_by: user.id,
  });

  if (rateInsert.error) return fail(rateInsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.debt_added",
    entityType: "liability",
    entityId: liabilityInsert.data.id,
    payload: {
      name,
      liabilityType,
      principalOriginal: Math.round(principalOriginal),
      currentOutstanding: Math.round(currentOutstanding),
      annualRatePercent: annualRate,
      repaymentMethod,
    },
  });

  revalidatePath("/onboarding/debts");
  return ok("Debt added.");
}

export async function addIncomeExpenseOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const monthlyIncome = Number(formData.get("monthlyIncome") ?? 0);
  const monthlyEssentials = Number(formData.get("monthlyEssentials") ?? 0);

  if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) return fail("Monthly income must be positive.");
  if (!Number.isFinite(monthlyEssentials) || monthlyEssentials < 0) return fail("Monthly essentials must be non-negative.");

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const today = new Date();
  const day = today.getDate();
  const startDate = today.toISOString().slice(0, 10);

  const account = await supabase
    .from("accounts")
    .select("id")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (account.error || !account.data?.id) {
    return fail(account.error?.message ?? "Add an account first before setting income/expenses.");
  }

  const incomeCategory = await supabase
    .from("categories")
    .select("id")
    .is("household_id", null)
    .eq("kind", "income")
    .eq("name", "Salary")
    .maybeSingle();

  const expenseCategory = await supabase
    .from("categories")
    .select("id")
    .is("household_id", null)
    .eq("kind", "expense")
    .eq("name", "Housing")
    .maybeSingle();

  if (incomeCategory.error || !incomeCategory.data?.id) return fail(incomeCategory.error?.message ?? "Missing Salary category seed data.");
  if (expenseCategory.error || !expenseCategory.data?.id) return fail(expenseCategory.error?.message ?? "Missing Housing category seed data.");

  const [incomeRule, expenseRule] = await Promise.all([
    supabase.from("recurring_rules").insert({
      household_id: householdId,
      template_json: {
        type: "income",
        category_id: incomeCategory.data.id,
        account_id: account.data.id,
        amount: Math.round(monthlyIncome),
        description: "Monthly household income",
      },
      frequency: "monthly",
      interval: 1,
      day_of_month: day,
      start_date: startDate,
      next_run_date: startDate,
      is_active: true,
      created_by: user.id,
    }),
    supabase.from("recurring_rules").insert({
      household_id: householdId,
      template_json: {
        type: "expense",
        category_id: expenseCategory.data.id,
        account_id: account.data.id,
        amount: Math.round(monthlyEssentials),
        description: "Monthly essential household expenses",
      },
      frequency: "monthly",
      interval: 1,
      day_of_month: day,
      start_date: startDate,
      next_run_date: startDate,
      is_active: true,
      created_by: user.id,
    }),
  ]);

  if (incomeRule.error) return fail(incomeRule.error.message);
  if (expenseRule.error) return fail(expenseRule.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.income_expense_baseline_set",
    entityType: "recurring_rule",
    payload: {
      monthlyIncome: Math.round(monthlyIncome),
      monthlyEssentials: Math.round(monthlyEssentials),
      startDate,
    },
  });

  revalidatePath("/onboarding/income-expenses");
  return ok("Income and essential expense baselines saved.");
}

export async function addFirstGoalOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const goalType = String(formData.get("goalType") ?? "emergency_fund").trim();
  const targetAmount = Number(formData.get("targetAmount") ?? 0);
  const targetDate = String(formData.get("targetDate") ?? "").trim();

  if (name.length < 2) return fail("Goal name must be at least 2 characters.");
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return fail("Target amount must be positive.");

  const { supabase, householdId, user, error } = await resolveUserAndHousehold();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const targetAmountRounded = Math.round(targetAmount);
  const insert = await supabase
    .from("goals")
    .insert({
      household_id: householdId,
      goal_type: goalType,
      name,
      target_amount: targetAmountRounded,
      target_date: targetDate.length > 0 ? targetDate : null,
      start_date: new Date().toISOString().slice(0, 10),
      priority: 1,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) return fail(insert.error?.message ?? "Failed to add first goal.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "onboarding.first_goal_added",
    entityType: "goal",
    entityId: insert.data.id,
    payload: { goalType, name, targetAmount: targetAmountRounded, targetDate: targetDate || null },
  });

  revalidatePath("/onboarding/first-goal");
  return ok("First goal added.");
}
