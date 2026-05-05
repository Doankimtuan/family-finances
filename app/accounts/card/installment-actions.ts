"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { resolveActionContext } from "@/lib/server/action-context";
import { createClient } from "@/lib/supabase/server";

export type InstallmentActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function refreshBillingMonthStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  billingMonthId: string,
) {
  const { data: month } = await supabase
    .from("card_billing_months")
    .select("id, statement_amount, paid_amount")
    .eq("id", billingMonthId)
    .maybeSingle();

  if (!month) return;

  const statementAmount = Number(month.statement_amount);
  const paidAmount = Number(month.paid_amount);
  const normalizedPaid = Math.max(0, Math.min(paidAmount, statementAmount));
  const status =
    statementAmount <= 0
      ? "settled"
      : normalizedPaid >= statementAmount
        ? "settled"
        : normalizedPaid > 0
          ? "partial"
          : "open";

  await supabase
    .from("card_billing_months")
    .update({
      paid_amount: normalizedPaid,
      status,
    })
    .eq("id", billingMonthId);

  await supabase
    .from("card_billing_items")
    .update({ is_paid: status === "settled" })
    .eq("billing_month_id", billingMonthId);
}

function formatDateOnlyUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnlyToUTC(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(Date.UTC(year, monthIdx, day));
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
  const base = parseDateOnlyToUTC(startBillingMonth);
  if (!base) return;

  for (let i = 0; i < numInstallments; i++) {
    const billingDate = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + i, 1),
    );
    const billingMonthStr = formatDateOnlyUTC(billingDate);

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

  const { supabase, user, householdId, error } = await resolveActionContext();
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

  revalidatePath("/accounts");
  revalidatePath(`/accounts/card/${cardAccountId}`);

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

  const { supabase, user, householdId, error } = await resolveActionContext();
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

  const startD = parseDateOnlyToUTC(startDate);
  if (!startD) return { status: "error", message: "Invalid start date." };

  let billingYear = startD.getUTCFullYear();
  let billingMonthIdx = startD.getUTCMonth();
  if (startD.getUTCDate() > statementDay) {
    billingMonthIdx += 1;
    if (billingMonthIdx > 11) {
      billingMonthIdx = 0;
      billingYear += 1;
    }
  }
  const startBillingMonthUtc = formatDateOnlyUTC(
    new Date(Date.UTC(billingYear, billingMonthIdx, 1)),
  );

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
    startBillingMonth: startBillingMonthUtc,
  });

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "installment.created",
    entityType: "installment_plan",
    entityId: plan.id,
    payload: { description, totalAmount, numInstallments },
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/card/${cardAccountId}`);

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

  const { supabase, user, householdId, error } = await resolveActionContext();
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
    status: "cleared",
    amount,
    transaction_date: date,
    description: "Thanh toán thẻ tín dụng (FIFO)",
    created_by: user.id,
  });

  if (insert.error) return { status: "error", message: insert.error.message };

  revalidatePath("/accounts");
  revalidatePath(`/accounts/card/${cardId}`);
  revalidatePath("/activity");

  return { status: "success", message: "Đã tất toán thẻ theo thứ tự FIFO." };
}

// ─── ACTION 4: Record card cashback credit ──────────────────────────────────
export async function addCardCashbackAction(
  _prev: InstallmentActionState,
  formData: FormData,
): Promise<InstallmentActionState> {
  const cardId = String(formData.get("cardId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const cashbackDate = String(
    formData.get("cashbackDate") ?? new Date().toISOString().slice(0, 10),
  );
  const note = String(formData.get("description") ?? "").trim();

  if (!cardId) {
    return { status: "error", message: "Missing card ID." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: "error", message: "Cashback amount must be positive." };
  }

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !user || !householdId) {
    return { status: "error", message: error ?? "No household found." };
  }

  const { data: card } = await supabase
    .from("accounts")
    .select("id, type")
    .eq("id", cardId)
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .is("deleted_at", null)
    .maybeSingle();
  if (!card || card.type !== "credit_card") {
    return { status: "error", message: "Credit card account not found." };
  }

  const description =
    note.length > 0 ? note : "Hoàn tiền thẻ tín dụng (cashback)";
  const roundedAmount = Math.round(amount);

  const latestUnpaidBeforeInsert = await supabase
    .from("card_billing_months")
    .select("id")
    .eq("card_account_id", cardId)
    .neq("status", "settled")
    .order("billing_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: txn, error: txnErr } = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      account_id: cardId,
      type: "income",
      status: "cleared",
      amount: roundedAmount,
      transaction_date: cashbackDate,
      description,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (txnErr || !txn) {
    return {
      status: "error",
      message: txnErr?.message ?? "Failed to add cashback transaction.",
    };
  }

  // Route cashback to the latest unpaid cycle so statement credit stays visible
  // on the cycle users are currently paying after statement generation.
  const billingItemResult = await supabase
    .from("card_billing_items")
    .select("id, billing_month_id")
    .eq("transaction_id", txn.id)
    .eq("card_account_id", cardId)
    .maybeSingle();

  const generatedItem = billingItemResult.data;
  const targetMonthId = latestUnpaidBeforeInsert.data?.id ?? null;

  if (generatedItem && targetMonthId && generatedItem.billing_month_id !== targetMonthId) {
    await supabase.rpc("increment_statement_amount", {
      month_id: generatedItem.billing_month_id,
      inc: roundedAmount,
    });
    await supabase.rpc("increment_statement_amount", {
      month_id: targetMonthId,
      inc: -roundedAmount,
    });
    await supabase
      .from("card_billing_items")
      .update({ billing_month_id: targetMonthId })
      .eq("id", generatedItem.id);
    await refreshBillingMonthStatus(supabase, generatedItem.billing_month_id);
    await refreshBillingMonthStatus(supabase, targetMonthId);
  } else if (generatedItem) {
    await refreshBillingMonthStatus(supabase, generatedItem.billing_month_id);
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "card.cashback_added",
    entityType: "transaction",
    entityId: txn.id,
    payload: {
      cardId,
      amount: roundedAmount,
      cashbackDate,
    },
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/card/${cardId}`);
  revalidatePath("/activity");

  return { status: "success", message: "Đã thêm hoàn tiền thẻ thành công." };
}
