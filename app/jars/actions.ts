"use server";

import { revalidatePath } from "next/cache";

import { isServerFeatureEnabled } from "@/lib/config/features";
import { writeAuditEvent } from "@/lib/server/audit";
import { resolveActionContext } from "@/lib/server/action-context";
import { ok, fail } from "@/lib/server/action-helpers";
import { createClient } from "@/lib/supabase/server";

import type { JarActionState } from "./action-types";

function toMonthStart(value: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  return `${value}-01`;
}

function toMonthInput(dateValue: string): string {
  const date = new Date(dateValue);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * jars-specific context: adds a feature-flag guard before the standard
 * auth + household resolution.
 */
async function resolveContext() {
  if (!isServerFeatureEnabled("jars")) {
    return {
      supabase: await createClient(),
      user: null,
      householdId: null,
      error: "Feature disabled: jars.",
    };
  }
  return resolveActionContext();
}


async function computeTargetAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  monthStart: string,
  mode: "fixed" | "percent",
  value: number,
): Promise<number> {
  if (mode === "fixed") return Math.max(0, Math.round(value));

  const start = new Date(monthStart);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const endIso = end.toISOString().slice(0, 10);

  const incomeResult = await supabase
    .from("transactions")
    .select("amount")
    .eq("household_id", householdId)
    .eq("type", "income")
    .gte("transaction_date", monthStart)
    .lt("transaction_date", endIso);

  if (incomeResult.error) return 0;

  const monthlyIncome = (incomeResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  return Math.max(0, Math.round((monthlyIncome * value) / 100));
}

export async function createJarAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim() || null;
  const icon = String(formData.get("icon") ?? "").trim() || null;

  if (name.length < 2) return fail("Tên hũ phải có ít nhất 2 ký tự.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const baseSlug = slugify(name) || "jar";

  const existingRes = await supabase
    .from("jar_definitions")
    .select("slug")
    .eq("household_id", householdId)
    .like("slug", `${baseSlug}%`);

  if (existingRes.error) return fail(existingRes.error.message);

  const used = new Set((existingRes.data ?? []).map((r) => r.slug));
  let slug = baseSlug;
  let i = 2;
  while (used.has(slug)) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }

  const insert = await supabase
    .from("jar_definitions")
    .insert({
      household_id: householdId,
      name,
      slug,
      color,
      icon,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id)
    return fail(insert.error?.message ?? "Không thể tạo hũ.");

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.created",
    entityType: "jar_definition",
    entityId: insert.data.id,
    payload: { name, slug, color, icon },
  });

  revalidatePath("/jars");
  revalidatePath("/dashboard");
  return ok("Đã tạo hũ.");
}

export async function updateJarAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim() || null;
  const icon = String(formData.get("icon") ?? "").trim() || null;

  if (!jarId) return fail("Thiếu ID hũ.");
  if (name.length < 2) return fail("Tên hũ phải có ít nhất 2 ký tự.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const update = await supabase
    .from("jar_definitions")
    .update({ name, color, icon })
    .eq("id", jarId)
    .eq("household_id", householdId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.updated",
    entityType: "jar_definition",
    entityId: jarId,
    payload: { name, color, icon },
  });

  revalidatePath("/jars");
  revalidatePath("/dashboard");
  return ok("Đã cập nhật hũ.");
}

export async function archiveJarAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  if (!jarId) return fail("Thiếu ID hũ.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const update = await supabase
    .from("jar_definitions")
    .update({ is_archived: true })
    .eq("id", jarId)
    .eq("household_id", householdId);

  if (update.error) return fail(update.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.archived",
    entityType: "jar_definition",
    entityId: jarId,
  });

  revalidatePath("/jars");
  revalidatePath("/dashboard");
  return ok("Đã lưu trữ hũ.");
}

export async function archiveJarDirectAction(
  formData: FormData,
): Promise<void> {
  await archiveJarAction({ status: "idle", message: "" }, formData);
}

export async function upsertJarMonthlyTargetAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  const monthRaw = String(formData.get("month") ?? "").trim();
  const modeRaw = String(formData.get("targetMode") ?? "fixed").trim();
  const value = Number(formData.get("targetValue") ?? 0);

  const monthStart = toMonthStart(monthRaw);
  const mode = modeRaw === "percent" ? "percent" : "fixed";

  if (!jarId) return fail("Thiếu ID hũ.");
  if (!monthStart) return fail("Tháng không hợp lệ.");
  if (!Number.isFinite(value) || value < 0) return fail("Giá trị mục tiêu phải không âm.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const computedTargetAmount = await computeTargetAmount(
    supabase,
    householdId,
    monthStart,
    mode,
    value,
  );

  const upsert = await supabase
    .from("jar_monthly_targets")
    .upsert(
      {
        household_id: householdId,
        jar_id: jarId,
        month: monthStart,
        target_mode: mode,
        target_value: Math.round(value),
        computed_target_amount: computedTargetAmount,
        created_by: user.id,
      },
      { onConflict: "jar_id,month" },
    );

  if (upsert.error) return fail(upsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.target_upserted",
    entityType: "jar_monthly_target",
    entityId: jarId,
    payload: {
      month: monthStart,
      targetMode: mode,
      targetValue: Math.round(value),
      computedTargetAmount,
    },
  });

  revalidatePath(`/jars?month=${toMonthInput(monthStart)}`);
  revalidatePath("/dashboard");
  return ok("Đã lưu mục tiêu tháng.");
}

export async function addJarLedgerEntryAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const jarId = String(formData.get("jarId") ?? "").trim();
  const entryTypeRaw = String(formData.get("entryType") ?? "allocate").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  const monthRaw = String(formData.get("month") ?? "").trim();
  const entryDate = String(formData.get("entryDate") ?? "").trim();

  const monthStart = toMonthStart(monthRaw);
  const entryType =
    entryTypeRaw === "withdraw" || entryTypeRaw === "adjust"
      ? entryTypeRaw
      : "allocate";

  if (!jarId) return fail("Thiếu ID hũ.");
  if (!monthStart) return fail("Tháng không hợp lệ.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Số tiền phải lớn hơn 0.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  if (entryType === "withdraw") {
    const ledgerResult = await supabase
      .from("jar_ledger_entries")
      .select("entry_type, amount")
      .eq("household_id", householdId)
      .eq("jar_id", jarId)
      .eq("month", monthStart);

    if (ledgerResult.error) return fail(ledgerResult.error.message);

    const balance = (ledgerResult.data ?? []).reduce((sum, row) => {
      const val = Number(row.amount ?? 0);
      return row.entry_type === "withdraw" ? sum - val : sum + val;
    }, 0);

    if (Math.round(amount) > balance) {
      return fail("Số tiền rút vượt quá số dư hũ.");
    }
  }

  const insert = await supabase
    .from("jar_ledger_entries")
    .insert({
      household_id: householdId,
      jar_id: jarId,
      entry_date: entryDate || monthStart,
      month: monthStart,
      entry_type: entryType,
      amount: Math.round(amount),
      note,
      source_kind: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data?.id) {
    return fail(insert.error?.message ?? "Không thể lưu giao dịch hũ.");
  }

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.ledger_added",
    entityType: "jar_ledger_entry",
    entityId: insert.data.id,
    payload: { jarId, month: monthStart, entryType, amount: Math.round(amount) },
  });

  revalidatePath(`/jars?month=${monthRaw}`);
  revalidatePath("/dashboard");
  return ok("Đã lưu giao dịch hũ.");
}

export async function deleteJarLedgerEntryAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const entryId = String(formData.get("entryId") ?? "").trim();
  const monthRaw = String(formData.get("month") ?? "").trim();

  if (!entryId) return fail("Thiếu ID giao dịch.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const del = await supabase
    .from("jar_ledger_entries")
    .delete()
    .eq("id", entryId)
    .eq("household_id", householdId);

  if (del.error) return fail(del.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.ledger_deleted",
    entityType: "jar_ledger_entry",
    entityId: entryId,
  });

  if (/^\d{4}-\d{2}$/.test(monthRaw)) revalidatePath(`/jars?month=${monthRaw}`);
  revalidatePath("/jars");
  revalidatePath("/dashboard");
  return ok("Đã xóa giao dịch hũ.");
}

export async function deleteJarLedgerEntryDirectAction(
  formData: FormData,
): Promise<void> {
  await deleteJarLedgerEntryAction({ status: "idle", message: "" }, formData);
}

export async function runJarReconciliationDirectAction(
  formData: FormData,
): Promise<void> {
  const monthRaw = String(formData.get("month") ?? "").trim();
  if (/^\\d{4}-\\d{2}$/.test(monthRaw)) {
    revalidatePath(`/jars?month=${monthRaw}`);
  }
  revalidatePath("/jars");
}

export async function updateSpendingJarCategoryMapAction(
  _prev: JarActionState,
  formData: FormData,
): Promise<JarActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const jarId = String(formData.get("jarId") ?? "").trim();

  if (!categoryId) return fail("Thiếu danh mục.");
  if (!jarId) return fail("Thiếu hũ.");

  const { supabase, user, householdId, error } = await resolveContext();
  if (error || !householdId || !user) return fail(error ?? "No household found.");

  const [categoryResult, jarResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, kind, household_id")
      .eq("id", categoryId)
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("jar_definitions")
      .select("id")
      .eq("id", jarId)
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!categoryResult.data?.id) return fail("Danh mục không hợp lệ.");
  if (categoryResult.data.kind !== "expense") {
    return fail("Chỉ hỗ trợ map cho danh mục chi tiêu.");
  }
  if (!jarResult.data?.id) return fail("Hũ không hợp lệ.");

  const upsert = await supabase.from("spending_jar_category_map").upsert(
    {
      household_id: householdId,
      category_id: categoryId,
      jar_id: jarId,
      created_by: user.id,
    },
    { onConflict: "household_id,category_id" },
  );

  if (upsert.error) return fail(upsert.error.message);

  await writeAuditEvent(supabase, {
    householdId,
    actorUserId: user.id,
    eventType: "jar.category_map_upserted",
    entityType: "spending_jar_category_map",
    entityId: categoryId,
    payload: { categoryId, jarId },
  });

  revalidatePath("/jars");
  revalidatePath("/dashboard");
  return ok("Đã cập nhật map danh mục → hũ.");
}

export async function updateSpendingJarCategoryMapDirectAction(
  formData: FormData,
): Promise<void> {
  await updateSpendingJarCategoryMapAction(
    { status: "idle", message: "" },
    formData,
  );
}
