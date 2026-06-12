"use server";

import { revalidatePath } from "next/cache";
import { writeAuditEvent } from "@/lib/server/audit";
import { resolveActionContext } from "@/lib/server/action-context";
import { ok, fail } from "@/lib/server/action-helpers";
import { getAccountBalanceSnapshot } from "@/lib/server/balance";
import { OUTBOUND_FLOW_TYPES, INBOUND_FLOW_TYPES } from "@/app/assets/_lib/constants";
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
  const quantity = Number(formData.get("quantity") ?? 0);
  const unitPrice = Number(formData.get("unitPrice") ?? 0);

  const isOutboundFromAccount = OUTBOUND_FLOW_TYPES.includes(flowType);
  const isInboundToAccount = INBOUND_FLOW_TYPES.includes(flowType);

  const finalAmount = amount > 0 ? amount : quantity * unitPrice;
  const amountRounded = Math.round(finalAmount);

  if (!assetId) return fail("assets.error.missing_asset_id");
  if (!Number.isFinite(amountRounded) || amountRounded <= 0)
    return fail("assets.error.cashflow_amount_positive");
  if (!flowDate) return fail("common.error.date_required");
  if (!accountId) return fail("assets.error.account_required");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !householdId || !user)
    return fail(error ?? "errors.household_not_found");

  const assetResult = await supabase
    .from("assets")
    .select("id, name, asset_class, quantity")
    .eq("household_id", householdId)
    .eq("id", assetId)
    .maybeSingle();
  if (assetResult.error || !assetResult.data)
    return fail(assetResult.error?.message ?? t("assets.error.not_found"));

  const accountResult = await supabase
    .from("accounts")
    .select("id, name")
    .eq("household_id", householdId)
    .eq("id", accountId)
    .eq("is_archived", false)
    .is("deleted_at", null)
    .maybeSingle();
  if (accountResult.error || !accountResult.data)
    return fail(accountResult.error?.message ?? t("assets.error.account_not_found"));

  if (!isOutboundFromAccount && !isInboundToAccount) {
    return fail(t("assets.error.invalid_flow_type"));
  }

  if (isOutboundFromAccount) {
    const snapshot = await getAccountBalanceSnapshot(
      supabase,
      householdId,
      accountId,
    );
    if (snapshot.error) return fail(snapshot.error);
    if (snapshot.balance !== null && amountRounded > snapshot.balance) {
      return fail(t("assets.error.insufficient_funds"));
    }
  }

  // 1. Insert into asset_cashflows
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
    return fail(insert.error?.message ?? t("assets.error.cashflow_failed"));

  // 2. Insert transaction in transactions table
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
      txInsert.error?.message ?? t("assets.error.cashflow_transaction_failed"),
    );
  }

  // 3. Update asset quantity and price if it is a Contribution or Withdrawal
  if (flowType === "contribution" || flowType === "withdrawal") {
    const currentQty = Number(assetResult.data.quantity ?? 0);
    const qtyChange = flowType === "contribution" ? quantity : -quantity;
    const newQty = currentQty + qtyChange;

    if (newQty < 0) {
      // Revert transaction and asset cashflow
      await supabase.from("transactions").delete().eq("id", txInsert.data.id);
      await supabase.from("asset_cashflows").delete().eq("id", insert.data.id);
      return fail(t("assets.error.insufficient_quantity"));
    }

    if (quantity > 0) {
      const qUpsert = await supabase.from("asset_quantity_history").upsert(
        {
          asset_id: assetId,
          household_id: householdId,
          as_of_date: flowDate,
          quantity: newQty,
          source: "calculated",
          created_by: user.id,
        },
        { onConflict: "asset_id,as_of_date" },
      );
      if (qUpsert.error) {
        // Revert transaction and asset cashflow
        await supabase.from("transactions").delete().eq("id", txInsert.data.id);
        await supabase.from("asset_cashflows").delete().eq("id", insert.data.id);
        return fail(qUpsert.error.message);
      }
    }

    if (unitPrice > 0) {
      const existingPriceResult = await supabase
        .from("asset_price_history")
        .select("id")
        .eq("asset_id", assetId)
        .eq("as_of_date", flowDate)
        .maybeSingle();

      if (existingPriceResult.error) {
        return fail(existingPriceResult.error.message);
      }

      const existingPrice = existingPriceResult.data;

      if (existingPrice) {
        const pUpdate = await supabase
          .from("asset_price_history")
          .update(
            flowType === "contribution"
              ? { unit_price: Math.round(unitPrice), ask_price: Math.round(unitPrice) }
              : { unit_price: Math.round(unitPrice), bid_price: Math.round(unitPrice) },
          )
          .eq("id", existingPrice.id);
        if (pUpdate.error) {
          return fail(pUpdate.error.message);
        }
      } else {
        const pInsert = await supabase.from("asset_price_history").insert({
          asset_id: assetId,
          household_id: householdId,
          as_of_date: flowDate,
          unit_price: Math.round(unitPrice),
          bid_price: Math.round(unitPrice),
          ask_price: Math.round(unitPrice),
          source: "manual",
          price_currency: "VND",
          created_by: user.id,
        });
        if (pInsert.error) {
          return fail(pInsert.error.message);
        }
      }
    }
  }

  // 4. Audit logging
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
      quantity,
      unitPrice,
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/accounts");
  return ok(t("assets.success.cashflow_recorded"));
}
