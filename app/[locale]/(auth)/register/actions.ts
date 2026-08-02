"use server";

import { signUpWithPassword } from "@/modules/tenancy/application/sign-up";
import { startOAuthSignIn } from "@/modules/tenancy/application/start-oauth-sign-in";
import type { OAuthProvider } from "@/modules/tenancy/application/oauth.schema";

export type RegisterActionState =
  | { status: "idle" }
  | { status: "success"; next: "home" | "confirm" }
  | {
      status: "error";
      code: "unconfigured" | "invalid" | "already_registered" | "unknown";
    };

export type OAuthActionState =
  | { status: "idle" }
  | { status: "success"; url: string }
  | {
      status: "error";
      code: "unconfigured" | "invalid" | "provider_error" | "unknown";
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
