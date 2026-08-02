"use server";

import {
  requestPasswordReset,
  type ResetPasswordErrorCode,
} from "@/modules/tenancy/application/request-password-reset";

export type ForgotPasswordActionState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      code: ResetPasswordErrorCode;
    };

export async function forgotPasswordAction(input: {
  email: string;
  redirectTo: string;
}): Promise<ForgotPasswordActionState> {
  const result = await requestPasswordReset(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}
