"use server";

import { pathForAuthEntry } from "@/modules/tenancy/application/auth-entry-path";
import type { AuthEntryAppPath } from "@/modules/tenancy/application/auth-entry-path";
import { resolveAuthEntry } from "@/modules/tenancy/application/resolve-auth-entry";
import {
  signInWithPassword,
  type SignInErrorCode,
} from "@/modules/tenancy/application/sign-in";

export type LoginActionState =
  | { status: "idle" }
  | { status: "success"; next: AuthEntryAppPath }
  | { status: "error"; code: SignInErrorCode };

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<LoginActionState> {
  const result = await signInWithPassword(input);
  if (result.ok) {
    const destination = await resolveAuthEntry();
    return { status: "success", next: pathForAuthEntry(destination) };
  }
  return { status: "error", code: result.code };
}
