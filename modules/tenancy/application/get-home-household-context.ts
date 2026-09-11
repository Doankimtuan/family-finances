import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { getSessionMembership } from "./get-session-membership";
import { HOUSEHOLD_ROLE, TENANCY_OPERATION } from "./tenancy-constants";
import { logTenancyFailure } from "./tenancy-error";

const HOME_HOUSEHOLD_SELECT =
  "name, locale, timezone, base_currency, month_close_mode, income_allocate_mode";

type HomeHouseholdRow = {
  name: string;
  locale: string | null;
  timezone: string | null;
  base_currency: string | null;
  month_close_mode: string | null;
  income_allocate_mode: string | null;
};

export type HomeHouseholdContext = {
  householdId: string;
  householdName: string;
  locale: string | null;
  timezone: string | null;
  baseCurrency: string | null;
  monthCloseMode: string | null;
  incomeAllocateMode: string | null;
  canEdit: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseHomeHouseholdRow(value: unknown): HomeHouseholdRow | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;

  return {
    name: value.name,
    locale: nullableString(value.locale),
    timezone: nullableString(value.timezone),
    base_currency: nullableString(value.base_currency),
    month_close_mode: nullableString(value.month_close_mode),
    income_allocate_mode: nullableString(value.income_allocate_mode),
  };
}

async function loadHomeHouseholdContext(): Promise<HomeHouseholdContext | null> {
  if (!getSupabaseEnv().isConfigured) return null;

  const { user, membership } = await getSessionMembership();
  if (!user || !membership) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("households")
      .select(HOME_HOUSEHOLD_SELECT)
      .eq("id", membership.householdId)
      .maybeSingle();

    if (error) {
      logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
        householdId: membership.householdId,
      });
      return null;
    }

    const household = parseHomeHouseholdRow(data);
    if (!household) return null;

    return {
      householdId: membership.householdId,
      householdName: household.name,
      locale: household.locale,
      timezone: household.timezone,
      baseCurrency: household.base_currency,
      monthCloseMode: household.month_close_mode,
      incomeAllocateMode: household.income_allocate_mode,
      canEdit: membership.role === HOUSEHOLD_ROLE.ADMIN,
    };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_QUERY, error, {
      householdId: membership.householdId,
    });
    return null;
  }
}

/** Exact Home household field union, request-local and never shared across users. */
export const getHomeHouseholdContext = cache(loadHomeHouseholdContext);
