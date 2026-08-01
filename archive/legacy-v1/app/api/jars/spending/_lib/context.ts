import { createClient } from "@/lib/supabase/server";

export type ApiHouseholdContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  householdId: string;
};

export async function resolveApiHouseholdContext(): Promise<
  { ok: true; value: ApiHouseholdContext } | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership.error) {
    return {
      ok: false,
      status: 500,
      error: `Failed to resolve household: ${membership.error.message}`,
    };
  }

  if (!membership.data?.household_id) {
    return {
      ok: false,
      status: 404,
      error: "No household found. Create or join a household first.",
    };
  }

  return {
    ok: true,
    value: { supabase, householdId: membership.data.household_id },
  };
}

export function parseMonthInput(value: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return `${new Date().toISOString().slice(0, 7)}-01`;
}
