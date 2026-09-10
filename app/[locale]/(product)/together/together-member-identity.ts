import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";

export function memberDisplayName(
  member: Pick<HouseholdMemberRow, "displayName" | "email">,
  unnamedFallback: string,
): string {
  const displayName = member.displayName?.trim();
  if (displayName) return displayName;
  const email = member.email?.trim();
  if (email) return email;
  return unnamedFallback;
}

export function memberInitials(
  email: string | null,
  displayName: string | null,
): string {
  const source = (displayName ?? email ?? "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
