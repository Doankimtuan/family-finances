import { cache } from "react";
import {
  withPerfSpan,
  PERF_TRACE_OP,
} from "@/modules/platform/application/perf-trace";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  isExpectedAuthControlFlowError,
  logTenancyFailure,
} from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

function readVerifiedSubject(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return value;
}

/**
 * Verified JWT subject from Supabase `getClaims()`, memoized for one server
 * render. Fail-closed: missing claims, missing `sub`, or verification errors
 * return null. Does not replace `getUser()`.
 */
async function loadVerifiedAuthSubject(): Promise<string | null> {
  if (!getSupabaseEnv().isConfigured) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await withPerfSpan(
      PERF_TRACE_OP.AUTH_GET_CLAIMS,
      () => supabase.auth.getClaims(),
    );
    if (error && !isExpectedAuthControlFlowError(error)) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
    }
    if (error || !data) {
      return null;
    }
    return readVerifiedSubject(data.claims.sub);
  } catch (error) {
    if (!isExpectedAuthControlFlowError(error)) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
    }
    return null;
  }
}

export const getVerifiedAuthSubject = cache(loadVerifiedAuthSubject);
