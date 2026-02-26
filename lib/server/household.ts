import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type AuthenticatedHouseholdContext = {
  user: User;
  householdId: string;
  householdName: string | null;
};

export async function getAuthenticatedHouseholdContext(): Promise<AuthenticatedHouseholdContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership.data?.household_id) {
    redirect("/household");
  }

  const household = await supabase
    .from("households")
    .select("name")
    .eq("id", membership.data.household_id)
    .maybeSingle();

  return {
    user,
    householdId: membership.data.household_id,
    householdName: household.data?.name ?? null,
  };
}
