import { z } from "zod";
import { HOUSEHOLD_ROLE_VALUES } from "./tenancy-constants";

export const changeHouseholdRoleInputSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(HOUSEHOLD_ROLE_VALUES),
});

export type ChangeHouseholdRoleInput = z.infer<
  typeof changeHouseholdRoleInputSchema
>;
