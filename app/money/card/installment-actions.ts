"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { createClient } from "@/lib/supabase/server";

export type InstallmentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      householdId: null,
      error: "You must be logged in.",
    };
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
    return {
      supabase,
      user,
      householdId: null,
      error: membership.error?.message ?? "No household found.",
    };
  }

  return {
    supabase,
    user,
    householdId: membership.data.household_id,
    error: null,
  };
}

// ─── Shared helper: generate N billing items for an installment plan ──────────
async function generateInstallmentItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    householdId,
    cardAccountId,
    planId,
    description,
    numInstallments,
    monthlyAmount,
    conversionFee,
    startBillingMonth,
  }: {
    householdId: string;
    cardAccountId: string;
    planId: string;
    description: string;
    numInstallments: number;
    monthlyAmount: number;
    conversionFee: number;
    startBillingMonth: string; // "YYYY-MM-01"
  },
) {
  const base = new Date(startBillingMonth);

  for (let i = 0; i < numInstallments; i++) {
    const billingDate = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const billingMonthStr = billingDate.toISOString().slice(0, 10);

    const { data: bMonth } = await supabase
      .from("card_billing_months")
      .upsert(
        {
          household_id: householdId,
          card_account_id: cardAccountId,
          billing_month: billingMonthStr,
        },
        { onConflict: "card_account_id, billing_month" },
      )
      .select("id")
      .single();

    if (!bMonth) continue;

    const feeThisMonth = i === 0 ? conversionFee : 0;

    await supabase.from("card_billing_items").insert({
      household_id: householdId,
      card_account_id: cardAccountId,
      billing_month_id: bMonth.id,
      installment_plan_id: planId,
      installment_sequence: i + 1,
      description: `${description} (${i + 1}/${numInstallments})`,
      amount: monthlyAmount,
      fee_amount: feeThisMonth,
      item_type: "installment",
    });

    await supabase.rpc("increment_statement_amount", {
      month_id: bMonth.id,
      inc: monthlyAmount + feeThisMonth,
    });
  }
}

// ─── ACTION 1: Convert a specific billing item to installment plan ────────────
// PRIMARY flow: user picks transaction from billing history → converts it to EMI
export async function convertItemToInstallmentAction(
  _prev: InstallmentActionState,
  formData: FormData,
): Promise<InstallmentActionState> {
  const sourceItemId = String(formData.get("sourceItemId") ?? "").trim();
  const numInstallments = Number(formData.get("numInstallments") ?? 3);
  const conversionFee = Number(formData.get("conversionFee") ?? 0);

  if (!sourceItemId)
    return { status: "error", message: "Missing source item." };
  if (numInstallments <= 0)
    return {
      status: "error",
      message: "Number of installments must be positive.",
    };

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return { status: "error", message: error ?? "No household found." };

  // 1. Fetch the source billing item with its billing month
  const { data: sourceItem, error: itemErr } = await supabase
    .from("card_billing_items")
    .select(
      "*, billing_month:card_billing_months!billing_month_id(id, billing_month, card_account_id)",
    )
    .eq("id", sourceItemId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (itemErr || !sourceItem)
    return { status: "error", message: "Billing item not found." };

  if (sourceItem.is_converted_to_installment)
    return {
      status: "error",
      message: "Giao dịch này đã được chuyển trả góp rồi.",
    };

  if (sourceItem.item_type === "installment")
    return {
      status: "error",
      message: "Không thể chuyển một khoản trả góp khác.",
    };

  const cardAccountId = sourceItem.card_account_id;
  const originalAmount = Number(sourceItem.amount);
  const description = sourceItem.description || "Giao dịch thẻ";
  const billingMonthId = sourceItem.billing_month_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startBillingMonthStr: string = (sourceItem.billing_month as any)
    ?.billing_month;

  if (!startBillingMonthStr)
    return { status: "error", message: "Không xác định được kỳ sao kê." };

  const monthlyAmount = Math.round(originalAmount / numInstallments);
  const totalAmount = originalAmount + conversionFee;

  // 2. Mark original item as converted & subtract its amount from source billing month
  await supabase
    .from("card_billing_items")
    .update({ is_converted_to_installment: true })
    .eq("id", sourceItemId);

  await supabase.rpc("increment_statement_amount", {
    month_id: billingMonthId,
    inc: -originalAmount,
  });

  // 3. Create installment plan record
  const { data: plan, error: planErr } = await supabase
    .from("installment_plans")
    .insert({
      household_id: householdId,
      card_account_id: cardAccountId,
      description,
      original_amount: originalAmount,
      conversion_fee: conversionFee,
      total_amount: totalAmount,
      num_installments: numInstallments,
      monthly_amount: monthlyAmount,
      start_date: startBillingMonthStr,
      remaining_amount: totalAmount,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (planErr || !plan)
    return {
      status: "error",
      message: planErr?.message ?? "Failed to create installment plan.",
    };

  // 4. Generate N billing items (1 per month starting from source billing month)
  await generateInstallmentItems(supabase, {
    householdId,
    cardAccountId,
    planId: plan.id,
    description,
    numInstallments,
    monthlyAmount,
    conversionFee,
    startBillingMonth: startBillingMonthStr,
  });

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "installment.converted",
    entityType: "installment_plan",
    entityId: plan.id,
    payload: { sourceItemId, description, totalAmount, numInstallments },
  });

  revalidatePath("/money");
  revalidatePath(`/money/card/${cardAccountId}`);

  return {
    status: "success",
    message: `Đã chuyển thành ${numInstallments} kỳ trả góp thành công!`,
  };
}

// ─── ACTION 2: Direct installment plan (standalone, without source item) ──────
export async function createInstallmentPlanAction(
  _prev: InstallmentActionState,
  formData: FormData,
): Promise<InstallmentActionState> {
  const cardAccountId = String(formData.get("cardAccountId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const originalAmount = Number(formData.get("originalAmount") ?? 0);
  const conversionFee = Number(formData.get("conversionFee") ?? 0);
  const numInstallments = Number(formData.get("numInstallments") ?? 3);
  const startDate = String(
    formData.get("startDate") ?? new Date().toISOString().slice(0, 10),
  );

  if (!cardAccountId)
    return { status: "error", message: "Missing card account ID." };
  if (description.length < 2)
    return { status: "error", message: "Description too short." };
  if (originalAmount <= 0)
    return { status: "error", message: "Amount must be positive." };
  if (numInstallments <= 0)
    return {
      status: "error",
      message: "Number of installments must be positive.",
    };

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return { status: "error", message: error ?? "No household found." };

  const totalAmount = originalAmount + conversionFee;
  const monthlyAmount = Math.round(totalAmount / numInstallments);

  const { data: settings } = await supabase
    .from("credit_card_settings")
    .select("statement_day")
    .eq("account_id", cardAccountId)
    .single();
  const statementDay = settings?.statement_day ?? 25;

  const startD = new Date(startDate);
  let billingYear = startD.getFullYear();
  let billingMonthIdx = startD.getMonth();
  if (startD.getDate() > statementDay) {
    billingMonthIdx += 1;
    if (billingMonthIdx > 11) {
      billingMonthIdx = 0;
      billingYear += 1;
    }
  }
  const startBillingMonth = new Date(billingYear, billingMonthIdx, 1)
    .toISOString()
    .slice(0, 10);

  const { data: plan, error: planErr } = await supabase
    .from("installment_plans")
    .insert({
      household_id: householdId,
      card_account_id: cardAccountId,
      description,
      original_amount: originalAmount,
      conversion_fee: conversionFee,
      total_amount: totalAmount,
      num_installments: numInstallments,
      monthly_amount: monthlyAmount,
      start_date: startDate,
      remaining_amount: totalAmount,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (planErr || !plan)
    return {
      status: "error",
      message: planErr?.message ?? "Failed to create plan.",
    };

  await generateInstallmentItems(supabase, {
    householdId,
    cardAccountId,
    planId: plan.id,
    description,
    numInstallments,
    monthlyAmount,
    conversionFee,
    startBillingMonth,
  });

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "installment.created",
    entityType: "installment_plan",
    entityId: plan.id,
    payload: { description, totalAmount, numInstallments },
  });

  revalidatePath("/money");
  revalidatePath(`/money/card/${cardAccountId}`);

  return { status: "success", message: "Kế hoạch trả góp đã được tạo." };
}

// ─── ACTION 3: FIFO Card Settlement ──────────────────────────────────────────
export async function settleCardAction(
  _prev: InstallmentActionState,
  formData: FormData,
): Promise<InstallmentActionState> {
  const cardId = String(formData.get("cardId") ?? "");
  const sourceAccountId = String(formData.get("sourceAccountId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(
    formData.get("date") ?? new Date().toISOString().slice(0, 10),
  );

  if (!cardId || !sourceAccountId || amount <= 0)
    return { status: "error", message: "Missing data or invalid amount." };

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId)
    return { status: "error", message: error ?? "No household found." };

  const { data: cycles } = await supabase
    .from("card_billing_months")
    .select("*")
    .eq("card_account_id", cardId)
    .neq("status", "settled")
    .order("billing_month", { ascending: true });

  let remainingPayment = amount;

  if (cycles && cycles.length > 0) {
    for (const cycle of cycles) {
      if (remainingPayment <= 0) break;
      const cycleRemaining =
        Number(cycle.statement_amount) - Number(cycle.paid_amount);
      if (cycleRemaining <= 0) continue;

      const paymentToApply = Math.min(remainingPayment, cycleRemaining);
      const newPaidAmount = Number(cycle.paid_amount) + paymentToApply;
      const newStatus =
        newPaidAmount >= Number(cycle.statement_amount) ? "settled" : "partial";

      await supabase
        .from("card_billing_months")
        .update({ paid_amount: newPaidAmount, status: newStatus })
        .eq("id", cycle.id);

      if (newStatus === "settled") {
        // Mark all items in this cycle as paid
        await supabase
          .from("card_billing_items")
          .update({ is_paid: true })
          .eq("billing_month_id", cycle.id);

        // ── Update installment_plans progress ─────────────────────────────
        // Fetch the installment items in this cycle to update their plans
        const { data: paidInstallmentItems } = await supabase
          .from("card_billing_items")
          .select("installment_plan_id, amount, fee_amount")
          .eq("billing_month_id", cycle.id)
          .eq("item_type", "installment")
          .not("installment_plan_id", "is", null);

        if (paidInstallmentItems && paidInstallmentItems.length > 0) {
          // Group by installment_plan_id
          const planUpdateMap = new Map<
            string,
            { count: number; totalPaid: number }
          >();
          for (const item of paidInstallmentItems) {
            if (!item.installment_plan_id) continue;
            const existing = planUpdateMap.get(item.installment_plan_id) ?? {
              count: 0,
              totalPaid: 0,
            };
            planUpdateMap.set(item.installment_plan_id, {
              count: existing.count + 1,
              totalPaid:
                existing.totalPaid +
                Number(item.amount) +
                Number(item.fee_amount),
            });
          }

          for (const [planId, { count, totalPaid }] of planUpdateMap) {
            const { data: plan } = await supabase
              .from("installment_plans")
              .select("paid_installments, remaining_amount, num_installments")
              .eq("id", planId)
              .single();
            if (!plan) continue;

            const newPaidInstallments = (plan.paid_installments ?? 0) + count;
            const newRemaining = Math.max(
              0,
              Number(plan.remaining_amount) - totalPaid,
            );
            const planStatus =
              newPaidInstallments >= plan.num_installments
                ? "completed"
                : "active";

            await supabase
              .from("installment_plans")
              .update({
                paid_installments: newPaidInstallments,
                remaining_amount: newRemaining,
                status: planStatus,
              })
              .eq("id", planId);
          }
        }
      }

      remainingPayment -= paymentToApply;
    }
  }

  const insert = await supabase.from("transactions").insert({
    household_id: householdId,
    account_id: sourceAccountId,
    counterparty_account_id: cardId,
    type: "transfer",
    amount,
    transaction_date: date,
    description: "Thanh toán thẻ tín dụng (FIFO)",
    created_by: user.id,
  });

  if (insert.error) return { status: "error", message: insert.error.message };

  revalidatePath("/money");
  revalidatePath(`/money/card/${cardId}`);
  revalidatePath("/transactions");

  return { status: "success", message: "Đã tất toán thẻ theo thứ tự FIFO." };
}
