"use server";

import { deleteAccount } from "@/modules/tenancy/application/delete-account";
import { AUTH_ACTION_ERROR_CODE } from "@/modules/tenancy/application/auth-constants";

export type DeleteAccountActionState =
  | { status: "success" }
  | {
      status: "error";
      code:
        | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
        | typeof AUTH_ACTION_ERROR_CODE.UNAUTHENTICATED
        | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN;
    };

export async function deleteAccountAction(): Promise<DeleteAccountActionState> {
  const result = await deleteAccount();
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}
