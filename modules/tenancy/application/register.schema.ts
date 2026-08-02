import { z } from "zod";

export const registerInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
