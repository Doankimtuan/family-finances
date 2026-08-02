"use server";

import { resolveAuthEntry } from "@/modules/tenancy/application/resolve-auth-entry";

export type AuthEntryPath = "/welcome" | "/home";

export async function resolveAuthEntryAction(): Promise<AuthEntryPath> {
  const destination = await resolveAuthEntry();
  return destination === "home" ? "/home" : "/welcome";
}
