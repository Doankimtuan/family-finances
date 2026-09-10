import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import {
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_ROLE,
} from "@/modules/tenancy/application/tenancy-constants";

export function isHouseholdAdmin(role: HouseholdMemberRow["role"]): boolean {
  return role === HOUSEHOLD_ROLE.ADMIN;
}

export function householdRoleLabel(
  role: HouseholdMemberRow["role"],
  labels: { admin: string; partner: string },
): string {
  return isHouseholdAdmin(role) ? labels.admin : labels.partner;
}

export function householdRoleHint(
  role: HouseholdMemberRow["role"],
  hints: { admin: string; partner: string },
): string {
  return isHouseholdAdmin(role) ? hints.admin : hints.partner;
}

const HOUSEHOLD_LOCALE_LABEL_KEY = {
  [HOUSEHOLD_LOCALE.ENGLISH_VIETNAM]: "localeEnglish",
  [HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM]: "localeVietnamese",
} as const;

export function householdLocaleLabelKey(
  locale: string,
):
  | (typeof HOUSEHOLD_LOCALE_LABEL_KEY)[keyof typeof HOUSEHOLD_LOCALE_LABEL_KEY]
  | null {
  if (
    locale === HOUSEHOLD_LOCALE.ENGLISH_VIETNAM ||
    locale === HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
  ) {
    return HOUSEHOLD_LOCALE_LABEL_KEY[locale];
  }
  return null;
}

export function memberRowAriaLabel(input: {
  name: string;
  isSelf: boolean;
  youLabel: string;
  roleLabel: string;
}): string {
  if (input.isSelf) {
    return `${input.name}, ${input.youLabel}, ${input.roleLabel}`;
  }
  return `${input.name}, ${input.roleLabel}`;
}

export function invitationRowAriaLabel(input: {
  email: string;
  status: string;
  expiry: string;
}): string {
  return `${input.email}, ${input.status}, ${input.expiry}`;
}
