import { z } from "zod";

export const oauthProviderSchema = z.enum(["google", "apple"]);

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

export const startOAuthInputSchema = z.object({
  provider: oauthProviderSchema,
  redirectTo: z.string().url(),
});

export type StartOAuthInput = z.infer<typeof startOAuthInputSchema>;
