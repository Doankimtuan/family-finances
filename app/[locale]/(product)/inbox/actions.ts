"use server";

import { resolveInboxItemToJar } from "@/modules/inbox/application";
import type { ResolveInboxItemInput } from "@/modules/inbox/application";

export type ResolveInboxActionState =
  | { status: "success" }
  | {
      status: "error";
      code: "unauthenticated" | "no_membership" | "invalid" | "unknown";
    };

export async function resolveInboxAction(
  input: ResolveInboxItemInput,
): Promise<ResolveInboxActionState> {
  const result = await resolveInboxItemToJar(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}
