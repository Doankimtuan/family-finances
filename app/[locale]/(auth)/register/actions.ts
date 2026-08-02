"use server";

import {
  signUpWithPassword,
  type SignUpErrorCode,
} from "@/modules/tenancy/application/sign-up";
import type { AuthSignUpNext } from "@/modules/tenancy/application/auth-constants";

export type RegisterActionState =
  | { status: "idle" }
  | { status: "success"; next: AuthSignUpNext }
  | {
      status: "error";
      code: SignUpErrorCode;
    };

export async function registerAction(input: {
  email: string;
  password: string;
  emailRedirectTo: string;
}): Promise<RegisterActionState> {
  const result = await signUpWithPassword(input);
  if (result.ok) {
    return { status: "success", next: result.next };
  }
  return { status: "error", code: result.code };
}
