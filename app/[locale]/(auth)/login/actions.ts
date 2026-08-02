"use server";

import { signInWithPassword } from "@/modules/tenancy/application/sign-in";
import { startOAuthSignIn } from "@/modules/tenancy/application/start-oauth-sign-in";
import type { OAuthProvider } from "@/modules/tenancy/application/oauth.schema";

export type LoginActionState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      code: "unconfigured" | "invalid_credentials" | "unknown";
    };

export type OAuthActionState =
  | { status: "idle" }
  | { status: "success"; url: string }
  | {
      status: "error";
      code: "unconfigured" | "invalid" | "provider_error" | "unknown";
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

export async function startOAuthAction(input: {
  provider: OAuthProvider;
  redirectTo: string;
}): Promise<OAuthActionState> {
  const result = await startOAuthSignIn(input);
  if (result.ok) {
    return { status: "success", url: result.url };
  }
  return { status: "error", code: result.code };
}
