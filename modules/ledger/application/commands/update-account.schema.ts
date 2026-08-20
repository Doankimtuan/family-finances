import { z } from "zod";
import { ACCOUNT_TYPE_VALUES } from "../ledger-constants";

export const updateAccountInputSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  type: z.enum(ACCOUNT_TYPE_VALUES),
});

export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>;
