"use server";

import { signInWithPassword } from "@/modules/tenancy/application/sign-in";

export type LoginActionState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      code: "unconfigured" | "invalid_credentials" | "unknown";
    };

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<LoginActionState> {
  const result = await signInWithPassword(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}
