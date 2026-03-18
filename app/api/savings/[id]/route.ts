import { NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/server/audit";
import { patchSavingsSchema } from "@/lib/savings/schemas";
import { buildSavingsDetailPayload, fetchSavingsBundle } from "@/lib/savings/service";
import { assertSavingsLinkedAccounts, getSavingsApiContext } from "@/lib/savings/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const { supabase, householdId } = await getSavingsApiContext();
    const bundle = await fetchSavingsBundle(supabase, householdId, { id });
    const account = bundle.accounts[0];
    if (!account) {
      return NextResponse.json({ error: "Savings not found." }, { status: 404 });
    }

    return NextResponse.json(
      buildSavingsDetailPayload(
        account,
        bundle.withdrawals.filter((row) => row.savings_account_id === id),
        Array.from(bundle.rates.values()).filter(
          (row) => row.provider_name === account.provider_name,
        ),
        bundle.actions.filter((row) => row.savings_account_id === id),
        new Date().toISOString().slice(0, 10),
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load savings detail." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const parsed = patchSavingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const { supabase, user, householdId } = await getSavingsApiContext();
    const current = await supabase
      .from("savings_accounts")
      .select("*")
      .eq("household_id", householdId)
      .eq("id", id)
      .maybeSingle();
    if (current.error || !current.data) {
      return NextResponse.json(
        { error: current.error?.message ?? "Savings not found." },
        { status: 404 },
      );
    }

    if (["withdrawn", "renewed", "cancelled"].includes(current.data.status)) {
      return NextResponse.json(
        { error: "Processed savings records can no longer be edited." },
        { status: 409 },
      );
    }

    const linkedAccountIds = parsed.data.linkedAccountIds ??
      (current.data.linked_account_ids as string[] | null) ??
      [current.data.primary_linked_account_id];
    const primaryLinkedAccountId =
      parsed.data.primaryLinkedAccountId ?? current.data.primary_linked_account_id;

    await assertSavingsLinkedAccounts(supabase, householdId, [
      primaryLinkedAccountId,
      ...linkedAccountIds,
    ]);

    const update = await supabase
      .from("savings_accounts")
      .update({
        goal_id:
          parsed.data.goalId === undefined ? current.data.goal_id : parsed.data.goalId,
        primary_linked_account_id: primaryLinkedAccountId,
        linked_account_ids: linkedAccountIds,
        maturity_preference:
          parsed.data.maturityPreference === undefined
            ? current.data.maturity_preference
            : parsed.data.maturityPreference,
        next_plan_config:
          parsed.data.nextPlanConfig === undefined
            ? current.data.next_plan_config
            : parsed.data.nextPlanConfig,
        notes:
          parsed.data.notes === undefined ? current.data.notes : parsed.data.notes,
      })
      .eq("household_id", householdId)
      .eq("id", id)
      .select("*")
      .single();

    if (update.error || !update.data) {
      return NextResponse.json(
        { error: update.error?.message ?? "Failed to update savings." },
        { status: 500 },
      );
    }

    await writeAuditEvent(supabase, {
      householdId,
      actorUserId: user.id,
      eventType: "savings.updated",
      entityType: "savings_account",
      entityId: id,
      payload: parsed.data,
    });

    return NextResponse.json(update.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update savings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const { supabase, householdId } = await getSavingsApiContext();

    const [accountResult, withdrawalsResult, actionsResult, childrenResult] =
      await Promise.all([
        supabase
          .from("savings_accounts")
          .select("id, created_at")
          .eq("household_id", householdId)
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("savings_withdrawals")
          .select("id")
          .eq("household_id", householdId)
          .eq("savings_account_id", id)
          .limit(1),
        supabase
          .from("savings_maturity_actions")
          .select("id")
          .eq("household_id", householdId)
          .eq("savings_account_id", id)
          .limit(1),
        supabase
          .from("savings_accounts")
          .select("id")
          .eq("household_id", householdId)
          .eq("parent_id", id)
          .limit(1),
      ]);

    if (accountResult.error || !accountResult.data) {
      return NextResponse.json(
        { error: accountResult.error?.message ?? "Savings not found." },
        { status: 404 },
      );
    }

    const createdDate = accountResult.data.created_at.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (
      (withdrawalsResult.data ?? []).length > 0 ||
      (actionsResult.data ?? []).length > 0 ||
      (childrenResult.data ?? []).length > 0 ||
      createdDate !== today
    ) {
      return NextResponse.json(
        { error: "Only same-day untouched savings records can be deleted." },
        { status: 409 },
      );
    }

    await supabase
      .from("transactions")
      .delete()
      .eq("household_id", householdId)
      .eq("related_savings_id", id)
      .eq("transaction_subtype", "savings_principal_deposit");

    const del = await supabase
      .from("savings_accounts")
      .delete()
      .eq("household_id", householdId)
      .eq("id", id);
    if (del.error) {
      return NextResponse.json({ error: del.error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete savings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 },
    );
  }
}
