import { z } from "zod";

export const inviteEmailSchema = z.object({
  email: z.string().trim().email().max(254),
});

export type InviteEmailInput = z.infer<typeof inviteEmailSchema>;

export const inviteTokenSchema = z.string().uuid();
