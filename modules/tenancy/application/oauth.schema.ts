import { z } from "zod";

export const OAuthProvider = {
  GOOGLE: "google",
  APPLE: "apple",
} as const;

export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider];

export const OAUTH_PROVIDER_VALUES = [
  OAuthProvider.GOOGLE,
  OAuthProvider.APPLE,
] as const;

export const oauthProviderSchema = z.enum(OAUTH_PROVIDER_VALUES);

export const startOAuthInputSchema = z.object({
  provider: oauthProviderSchema,
  redirectTo: z.string().url(),
});

export type StartOAuthInput = z.infer<typeof startOAuthInputSchema>;
