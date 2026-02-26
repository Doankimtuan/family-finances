"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import type { AssetActionState } from "./action-types";

function ok(message: string): AssetActionState {
  return { status: "success", message };
}

function fail(message: string): AssetActionState {
  return { status: "error", message };
}

async function resolveContext() {
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

  if (membership.error || !membership.data?.household_id) {
    return { supabase, user, householdId: null, error: membership.error?.message ?? "No household found." };
  }

  return { supabase, user, householdId: membership.data.household_id, error: null };
}

export async function createAssetAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const assetClass = String(formData.get("assetClass") ?? "other").trim();
  const unitLabel = String(formData.get("unitLabel") ?? "unit").trim() || "unit";
  const quantity = Number(formData.get("quantity") ?? 0);
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  const isLiquid = String(formData.get("isLiquid") ?? "false") === "true";

  if (name.length < 2) return fail("Asset name must be at least 2 characters.");
  if (!Number.isFinite(quantity) || quantity < 0) return fail("Quantity must be non-negative.");
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return fail("Unit price must be non-negative.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

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
    })
    .select("id")
    .single();

  if (asset.error || !asset.data?.id) {
    return fail(asset.error?.message ?? "Failed to create asset.");
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

  revalidatePath("/assets");
  return ok("Asset created.");
}

export async function upsertQuantityHistoryAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const asOfDate = String(formData.get("asOfDate") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!assetId) return fail("Missing asset id.");
  if (!asOfDate) return fail("Date is required.");
  if (!Number.isFinite(quantity) || quantity < 0) return fail("Quantity must be non-negative.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

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

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok("Quantity history saved.");
}

export async function upsertPriceHistoryAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const assetId = String(formData.get("assetId") ?? "").trim();
  const asOfDate = String(formData.get("asOfDate") ?? "").trim();
  const unitPrice = Number(formData.get("unitPrice") ?? 0);

  if (!assetId) return fail("Missing asset id.");
  if (!asOfDate) return fail("Date is required.");
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return fail("Unit price must be non-negative.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !user || !householdId) return fail(error ?? "No household found.");

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

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok("Price history saved.");
}

export async function updateQuantityHistoryRowAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const rowId = String(formData.get("rowId") ?? "").trim();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!rowId) return fail("Missing history row id.");
  if (!assetId) return fail("Missing asset id.");
  if (!Number.isFinite(quantity) || quantity < 0) return fail("Quantity must be non-negative.");

  const { supabase, error } = await resolveContext();
  if (error) return fail(error);

  const update = await supabase
    .from("asset_quantity_history")
    .update({ quantity })
    .eq("id", rowId);

  if (update.error) return fail(update.error.message);

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok("Quantity entry updated.");
}

export async function updatePriceHistoryRowAction(
  _prev: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const rowId = String(formData.get("rowId") ?? "").trim();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const unitPrice = Number(formData.get("unitPrice") ?? 0);

  if (!rowId) return fail("Missing history row id.");
  if (!assetId) return fail("Missing asset id.");
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return fail("Price must be non-negative.");

  const { supabase, error } = await resolveContext();
  if (error) return fail(error);

  const update = await supabase
    .from("asset_price_history")
    .update({ unit_price: Math.round(unitPrice) })
    .eq("id", rowId);

  if (update.error) return fail(update.error.message);

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
  return ok("Price entry updated.");
}
