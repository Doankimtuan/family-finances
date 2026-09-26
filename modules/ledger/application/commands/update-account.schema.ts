import { z } from "zod";
import { ACCOUNT_TYPE_VALUES, ACCOUNT_ICON_KEYS } from "../ledger-constants";

export const updateAccountInputSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  type: z.enum(ACCOUNT_TYPE_VALUES),
  iconKey: z.enum(ACCOUNT_ICON_KEYS).nullable().optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>;
