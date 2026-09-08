import { cache } from "react";
import {
  withPerfSpan,
  PERF_TRACE_OP,
} from "@/modules/platform/application/perf-trace";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import type { User } from "@supabase/supabase-js";
import {
  isExpectedAuthControlFlowError,
  logTenancyFailure,
} from "./tenancy-error";
import { TENANCY_OPERATION } from "./tenancy-constants";

/** Current Auth user, memoized for the server render, or null on failure. */
async function loadSessionUser(): Promise<User | null> {
  if (!getSupabaseEnv().isConfigured) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await withPerfSpan(PERF_TRACE_OP.AUTH_GET_USER, () =>
      supabase.auth.getUser(),
    );
    if (error && !isExpectedAuthControlFlowError(error)) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
    }
    if (error) {
      return null;
    }
    return user;
  } catch (error) {
    if (!isExpectedAuthControlFlowError(error)) {
      logTenancyFailure(TENANCY_OPERATION.AUTH_SESSION, error);
    }
    return null;
  }
}

export const getSessionUser = cache(loadSessionUser);
