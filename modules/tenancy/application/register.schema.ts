import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "./auth-constants";

export const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH);

export const registerInputSchema = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
