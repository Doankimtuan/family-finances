"use server";

import { revalidatePath } from "next/cache";

import { writeAuditEvent } from "@/lib/server/audit";
import { resolveActionContext } from "@/lib/server/action-context";
import { ok, fail } from "@/lib/server/action-helpers";

import type { AssetActionState } from "./action-types";
import { redirect } from "next/navigation";
import { getAssetClassConfig } from "@/lib/assets/class-config";

export async function createAssetAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const assetClass = String(formData.get("assetClass") ?? "other").trim();
  const unitLabel =
    String(formData.get("unitLabel") ?? "unit").trim() || "unit";
  const quantity = Number(formData.get("quantity") ?? 0);
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  const isLiquid = String(formData.get("isLiquid") ?? "false") === "true";

  // Extract class-specific metadata fields (prefixed with meta_)
  const classConfig = getAssetClassConfig(assetClass);
  const metadata: Record<string, string | number | boolean> = {};
  for (const field of classConfig.metadataFields) {
    const raw = formData.get(`meta_${field.key}`);
    if (raw !== null && String(raw).trim() !== "") {
      const val = String(raw).trim();
      if (field.type === "number") {
        metadata[field.key] = Number(val);
      } else if (field.type === "boolean") {
        metadata[field.key] = val === "true";
      } else {
        metadata[field.key] = val;
      }
    }
  }

  if (name.length < 2) return fail("common.error.name_length");
  if (!Number.isFinite(quantity) || quantity < 0)
    return fail("common.error.amount_negative");
  if (!Number.isFinite(unitPrice) || unitPrice < 0)
    return fail("common.error.amount_negative");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  const today = new Date().toISOString().slice(0, 10);

  const asset = await supabase
    .from("assets")
    .insert({
      household_id: householdId,
      name,
      asset_class: assetClass,
      unit_label: unitLabel,
      quantity,
      acquisition_cost: Math.round(quantity * unitPrice),
      acquisition_date: today,
      is_liquid: isLiquid,
      include_in_net_worth: true,
      created_by: user.id,
      metadata,
      valuation_method: classConfig.defaultValuationMethod,
      risk_level: classConfig.defaultRisk,
    })
    .select("id")
    .single();

  if (asset.error || !asset.data?.id) {
    return fail(asset.error?.message ?? t("assets.error.failed_create"));
  }

  const [qInsert, pInsert] = await Promise.all([
    supabase.from("asset_quantity_history").insert({
      asset_id: asset.data.id,
      household_id: householdId,
      as_of_date: today,
      quantity,
      source: "manual",
      created_by: user.id,
    }),
    supabase.from("asset_price_history").insert({
      asset_id: asset.data.id,
      household_id: householdId,
      as_of_date: today,
      unit_price: Math.round(unitPrice),
      source: "manual",
      price_currency: "VND",
      created_by: user.id,
    }),
  ]);

  if (qInsert.error) return fail(qInsert.error.message);
  if (pInsert.error) return fail(pInsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.created",
    entityType: "asset",
    entityId: asset.data.id,
    payload: {
      name,
      assetClass,
      unitLabel,
      quantity,
      unitPrice: Math.round(unitPrice),
      isLiquid,
      asOfDate: today,
    },
  });

  revalidatePath("/assets");
  return ok(t("assets.success.created"));
}

export async function upsertQuantityHistoryAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const asOfDate = String(formData.get("asOfDate") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!assetId) return fail("common.error.missing_id");
  if (!asOfDate) return fail("common.error.date_required");
  if (!Number.isFinite(quantity) || quantity < 0)
    return fail("common.error.amount_negative");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  const upsert = await supabase.from("asset_quantity_history").upsert(
    {
      asset_id: assetId,
      household_id: householdId,
      as_of_date: asOfDate,
      quantity,
      source: "manual",
      created_by: user.id,
    },
    { onConflict: "asset_id,as_of_date" },
  );

  if (upsert.error) return fail(upsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.quantity_history_upserted",
    entityType: "asset",
    entityId: assetId,
    payload: { asOfDate, quantity },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok(t("assets.success.quantity_saved"));
}

export async function upsertPriceHistoryAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const asOfDate = String(formData.get("asOfDate") ?? "").trim();
  const unitPrice = Number(formData.get("unitPrice") ?? 0);

  if (!assetId) return fail("common.error.missing_id");
  if (!asOfDate) return fail("common.error.date_required");
  if (!Number.isFinite(unitPrice) || unitPrice < 0)
    return fail("common.error.amount_negative");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  const upsert = await supabase.from("asset_price_history").upsert(
    {
      asset_id: assetId,
      household_id: householdId,
      as_of_date: asOfDate,
      unit_price: Math.round(unitPrice),
      source: "manual",
      price_currency: "VND",
      created_by: user.id,
    },
    { onConflict: "asset_id,as_of_date" },
  );

  if (upsert.error) return fail(upsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.price_history_upserted",
    entityType: "asset",
    entityId: assetId,
    payload: { asOfDate, unitPrice: Math.round(unitPrice), currency: "VND" },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok(t("assets.success.price_saved"));
}

export async function updateQuantityHistoryRowAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const rowId = String(formData.get("rowId") ?? "").trim();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!rowId) return fail("common.error.missing_id");
  if (!assetId) return fail("common.error.missing_id");
  if (!Number.isFinite(quantity) || quantity < 0)
    return fail("common.error.amount_negative");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  const update = await supabase
    .from("asset_quantity_history")
    .update({ quantity })
    .eq("id", rowId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.quantity_history_updated",
    entityType: "asset",
    entityId: assetId,
    payload: { rowId, quantity },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok(t("assets.success.quantity_updated"));
}

export async function updatePriceHistoryRowAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const rowId = String(formData.get("rowId") ?? "").trim();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const unitPrice = Number(formData.get("unitPrice") ?? 0);

  if (!rowId) return fail("common.error.missing_id");
  if (!assetId) return fail("common.error.missing_id");
  if (!Number.isFinite(unitPrice) || unitPrice < 0)
    return fail("common.error.amount_negative");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  const update = await supabase
    .from("asset_price_history")
    .update({ unit_price: Math.round(unitPrice) })
    .eq("id", rowId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.price_history_updated",
    entityType: "asset",
    entityId: assetId,
    payload: { rowId, unitPrice: Math.round(unitPrice), currency: "VND" },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/accounts");
  return ok(t("assets.success.price_updated"));
}

export async function deleteAssetAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const assetId = String(formData.get("assetId") ?? "").trim();
  if (!assetId) return fail("common.error.missing_id");

  const { supabase, user, householdId, t, error } = await resolveActionContext();
  if (error || !user || !householdId)
    return fail(error ?? "errors.household_not_found");

  const existing = await supabase
    .from("assets")
    .select("id, name")
    .eq("id", assetId)
    .eq("household_id", householdId)
    .maybeSingle();

  if (existing.error) return fail(existing.error.message);
  if (!existing.data) return fail(t("assets.error.not_found"));

  const del = await supabase
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("household_id", householdId);

  if (del.error) return fail(del.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "asset.deleted",
    entityType: "asset",
    entityId: assetId,
    payload: { name: existing.data.name },
  });

  redirect("/accounts");
}
