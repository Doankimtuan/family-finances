"use server";

import { signUpWithPassword } from "@/modules/tenancy/application/sign-up";

export type RegisterActionState =
  | { status: "idle" }
  | { status: "success"; next: "home" | "confirm" }
  | {
      status: "error";
      code: "unconfigured" | "invalid" | "already_registered" | "unknown";
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
