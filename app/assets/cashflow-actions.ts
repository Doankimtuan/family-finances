"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { resolveActionContext } from "@/lib/server/action-context";
import { ok, fail } from "@/lib/server/action-helpers";
import { getAccountBalanceSnapshot } from "@/lib/server/balance";
import type { AssetActionState } from "./action-types";

export async function addAssetCashflowAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const flowDate = String(formData.get("flowDate") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const flowType = String(formData.get("flowType") ?? "contribution").trim();
  const accountId = String(formData.get("accountId") ?? "").trim();

  if (!assetId) return fail("Missing asset id.");
  if (!Number.isFinite(amount) || amount <= 0)
    return fail("Cash flow amount must be greater than zero.");
  if (!flowDate) return fail("Date is required.");
  if (!accountId) return fail("Account is required.");

  const { supabase, user, householdId, error } = await resolveActionContext();
  if (error || !householdId || !user)
    return fail(error ?? "No household found.");

  const assetResult = await supabase
    .from("assets")
    .select("id, name")
    .eq("household_id", householdId)
    .eq("id", assetId)
    .maybeSingle();
  if (assetResult.error || !assetResult.data)
    return fail(assetResult.error?.message ?? "Asset not found.");

  const accountResult = await supabase
    .from("accounts")
    .select("id, name")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .eq("is_archived", false)
    .maybeSingle();
  if (accountResult.error || !accountResult.data)
    return fail(accountResult.error?.message ?? "Account not found.");

  const amountRounded = Math.round(amount);
  const isOutboundFromAccount = ["contribution", "fee", "tax"].includes(
    flowType,
  );
  const isInboundToAccount = ["withdrawal", "income"].includes(flowType);

  if (!isOutboundFromAccount && !isInboundToAccount) {
    return fail("Invalid flow type.");
  }

  if (isOutboundFromAccount) {
    const snapshot = await getAccountBalanceSnapshot(
      supabase,
      householdId,
      accountId,
    );
    if (snapshot.error) return fail(snapshot.error);
    if (snapshot.balance !== null && amountRounded > snapshot.balance) {
      return fail(
        "Asset cashflow not recorded: amount exceeds source account balance.",
      );
    }
  }

  const insert = await supabase
    .from("asset_cashflows")
    .insert({
      asset_id: assetId,
      household_id: householdId,
      flow_date: flowDate,
      amount: amountRounded,
      flow_type: flowType,
      source_account_id: isOutboundFromAccount ? accountId : null,
      destination_account_id: isInboundToAccount ? accountId : null,
      created_by: user.id,
      note: note.length > 0 ? note : null,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id)
    return fail(insert.error?.message ?? "Failed to add asset cash flow.");

  const txInsert = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      account_id: accountId,
      type: isOutboundFromAccount ? "expense" : "income",
      amount: amountRounded,
      currency: "VND",
      transaction_date: flowDate,
      description: `Asset ${flowType}: ${assetResult.data.name}`,
      category_id: null,
      paid_by_member_id: user.id,
      status: "cleared",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (txInsert.error || !txInsert.data?.id) {
    await supabase.from("asset_cashflows").delete().eq("id", insert.data.id);
    return fail(
      txInsert.error?.message ??
        "Failed to record account cash flow for asset.",
    );
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.cashflow_added",
    entityType: "asset_cashflow",
    entityId: insert.data.id,
    payload: {
      assetId,
      amount: amountRounded,
      flowDate,
      flowType,
      accountId,
      transactionId: txInsert.data.id,
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  return ok("Asset cash flow recorded.");
}
