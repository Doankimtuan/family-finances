import { z } from "zod";
import { passwordSchema } from "./register.schema";

export const updatePasswordInputSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordInputSchema>;
