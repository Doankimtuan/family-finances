import { z } from "zod";
import {
  HOUSEHOLD_BASE_CURRENCY,
  HOUSEHOLD_LOCALE_VALUES,
  HOUSEHOLD_TIMEZONE,
} from "./tenancy-constants";

export const householdPreferencesInputSchema = z.object({
  locale: z.enum(HOUSEHOLD_LOCALE_VALUES),
  timezone: z.literal(HOUSEHOLD_TIMEZONE.VIETNAM),
  baseCurrency: z.literal(HOUSEHOLD_BASE_CURRENCY.VIETNAM_DONG),
});

export type HouseholdPreferencesInput = z.infer<
  typeof householdPreferencesInputSchema
>;
