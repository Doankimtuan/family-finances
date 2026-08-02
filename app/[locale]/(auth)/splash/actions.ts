"use server";

import { pathForAuthEntry } from "@/modules/tenancy/application/auth-entry-path";
import { resolveAuthEntry } from "@/modules/tenancy/application/resolve-auth-entry";
import type { AuthEntryAppPath } from "@/modules/tenancy/application/auth-entry-path";

export type AuthEntryPath = AuthEntryAppPath;

export async function resolveAuthEntryAction(): Promise<AuthEntryPath> {
  const destination = await resolveAuthEntry();
  return pathForAuthEntry(destination);
}
