import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  createHouseholdInputSchema,
  type CreateHouseholdInput,
} from "./create-household.schema";
import { getSessionUser } from "./get-session-user";
import { resolveActiveMembership } from "./resolve-active-membership";
import {
  HOUSEHOLD_ERROR_CODE,
  type HouseholdErrorCode,
} from "./tenancy-constants";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";
import {
  classifyHouseholdRpcError,
  HOUSEHOLD_RPC_OPERATION,
  logTenancyFailure,
} from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

export type CreateHouseholdErrorCode = Extract<
  HouseholdErrorCode,
  | typeof HOUSEHOLD_ERROR_CODE.UNCONFIGURED
  | typeof HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED
  | typeof HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER
  | typeof HOUSEHOLD_ERROR_CODE.INVALID
  | typeof HOUSEHOLD_ERROR_CODE.UNKNOWN
>;

export type CreateHouseholdResult = Result<
  { householdId: string },
  CreateHouseholdErrorCode
>;

/**
 * Create household + owner membership + account/jar seeds (AC-012 / AC-014 / BR-12).
 */
export async function createHousehold(
  raw: CreateHouseholdInput,
): Promise<CreateHouseholdResult> {
  const parsed = createHouseholdInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.INVALID };
  }

  if (!getSupabaseEnv().isConfigured) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNCONFIGURED };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNAUTHENTICATED };
  }

  const existing = await resolveActiveMembership(user.id);
  if (existing) {
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.ALREADY_MEMBER };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(
      "create_household_with_essentials",
      {
        p_name: parsed.data.name,
        p_account_name: parsed.data.accountName,
        p_plan_preset: parsed.data.planPreset,
        p_base_currency: parsed.data.baseCurrency ?? DEFAULT_CURRENCY,
        p_locale: parsed.data.locale ?? "en-VN",
        p_timezone: parsed.data.timezone ?? "Asia/Ho_Chi_Minh",
      },
    );

    if (error) {
      const mapped = classifyHouseholdRpcError(
        error,
        HOUSEHOLD_RPC_OPERATION.CREATE,
      );
      const code =
        mapped === HOUSEHOLD_ERROR_CODE.NO_HOUSEHOLD ||
        mapped === HOUSEHOLD_ERROR_CODE.FORBIDDEN ||
        mapped === HOUSEHOLD_ERROR_CODE.MEMBER_NOT_FOUND
          ? HOUSEHOLD_ERROR_CODE.UNKNOWN
          : mapped;
      if (code === HOUSEHOLD_ERROR_CODE.UNKNOWN) {
        logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_CREATE, error);
      }
      return { ok: false, code };
    }

    if (typeof data !== "string" || data.length === 0) {
      logTenancyFailure(
        TENANCY_OPERATION.HOUSEHOLD_CREATE,
        new Error("create household returned an invalid id"),
      );
      return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, householdId: data };
  } catch (error) {
    logTenancyFailure(TENANCY_OPERATION.HOUSEHOLD_CREATE, error);
    return { ok: false, code: HOUSEHOLD_ERROR_CODE.UNKNOWN };
  }
}
