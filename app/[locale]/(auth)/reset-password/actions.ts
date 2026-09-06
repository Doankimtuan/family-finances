"use server";

import { pathForAuthEntry } from "@/modules/tenancy/application/auth-entry-path";
import type { AuthEntryAppPath } from "@/modules/tenancy/application/auth-entry-path";
import { resolveAuthEntry } from "@/modules/tenancy/application/resolve-auth-entry";
import {
  updatePassword,
  type UpdatePasswordErrorCode,
} from "@/modules/tenancy/application/update-password";
import type { UpdatePasswordInput } from "@/modules/tenancy/application/update-password.schema";

export type UpdatePasswordActionState =
  | { status: "success"; next: AuthEntryAppPath }
  | { status: "error"; code: UpdatePasswordErrorCode };

export async function updatePasswordAction(
  input: UpdatePasswordInput,
): Promise<UpdatePasswordActionState> {
  const result = await updatePassword(input);
  if (!result.ok) {
    return { status: "error", code: result.code };
  }

  const destination = await resolveAuthEntry();
  return { status: "success", next: pathForAuthEntry(destination) };
}
