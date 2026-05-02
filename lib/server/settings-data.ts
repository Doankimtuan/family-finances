import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { localeToLanguage, normalizeHouseholdLocale, type AppLanguage } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type SettingsDataContext = {
  user: User;
  householdId: string;
  householdName: string | null;
  householdLocale: string;
  language: AppLanguage;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  household?: {
    name: string | null;
    timezone: string | null;
    locale: string | null;
  };
  assumptions?: {
    assumptions_inflation_annual: number | null;
    assumptions_cash_return_annual: number | null;
    assumptions_investment_return_annual: number | null;
    assumptions_property_growth_annual: number | null;
    assumptions_gold_growth_annual: number | null;
    assumptions_salary_growth_annual: number | null;
  };
  members?: {
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
  }[];
  pendingInvites?: {
    id: string;
    email: string;
    token: string;
    expires_at: string;
  }[];
  incomingInvites?: {
    id: string;
    token: string;
    expires_at: string;
    households: { name: string } | null;
  }[];
};

export async function getSettingsDataContext(
  includeProfile: boolean = false,
  includeHousehold: boolean = false,
  includeAssumptions: boolean = false,
  includeMembers: boolean = false,
): Promise<SettingsDataContext> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get household membership and basic household info in one query
  const membershipQuery = supabase
    .from("household_members")
    .select(`
      household_id,
      households!inner(name, locale)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const membershipResult = await membershipQuery;

  if (!membershipResult.data?.household_id) {
    redirect("/household");
  }

  // Extract household data from the JOIN result
  const householdsArray = membershipResult.data.households as { name: any; locale: any }[] | undefined;
  const householdData = householdsArray?.[0] as { name: string | null; locale: string | null } | undefined;
  const householdLocale = normalizeHouseholdLocale(householdData?.locale);
  const language = localeToLanguage(householdLocale);

  const context: SettingsDataContext = {
    user,
    householdId: membershipResult.data.household_id,
    householdName: householdData?.name ?? null,
    householdLocale,
    language,
  };

  const promises: Promise<any>[] = [];

  if (includeProfile) {
    promises.push(
      Promise.resolve(
        supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle(),
      ),
    );
  }

  if (includeHousehold) {
    promises.push(
      Promise.resolve(
        supabase
          .from("households")
          .select("name, timezone, locale")
          .eq("id", membershipResult.data.household_id)
          .maybeSingle(),
      ),
    );
  }

  if (includeAssumptions) {
    promises.push(
      Promise.resolve(
        supabase
          .from("households")
          .select(
            "assumptions_inflation_annual, assumptions_cash_return_annual, assumptions_investment_return_annual, assumptions_property_growth_annual, assumptions_gold_growth_annual, assumptions_salary_growth_annual",
          )
          .eq("id", membershipResult.data.household_id)
          .maybeSingle(),
      ),
    );
  }

  if (includeMembers) {
    promises.push(
      Promise.resolve(
        supabase
          .from("household_members")
          .select(
            "id, user_id, role, joined_at, profiles!household_members_user_id_fkey(full_name, email)",
          )
          .eq("household_id", membershipResult.data.household_id)
          .eq("is_active", true)
          .order("joined_at", { ascending: true }),
      ),
    );

    promises.push(
      Promise.resolve(
        supabase
          .from("household_invitations")
          .select("id, email, token, expires_at")
          .eq("household_id", membershipResult.data.household_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ),
    );

    promises.push(
      Promise.resolve(
        supabase
          .from("household_invitations")
          .select("id, token, expires_at, households!household_id(name)")
          .eq("email", user.email)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ),
    );
  }

  const results = await Promise.all(promises);

  if (includeProfile) context.profile = results.shift().data;
  if (includeHousehold) context.household = results.shift().data;
  if (includeAssumptions) context.assumptions = results.shift().data;
  if (includeMembers) {
    context.members = results.shift().data || [];
    context.pendingInvites = results.shift().data || [];
    context.incomingInvites = results.shift().data || [];
  }

  return context;
}
