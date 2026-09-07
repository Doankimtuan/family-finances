import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";

const MEMBER_ID_FALLBACK_LENGTH = 8;

export function memberDisplayName(
  member: Pick<HouseholdMemberRow, "displayName" | "email" | "userId">,
): string {
  return (
    member.displayName ??
    member.email ??
    member.userId.slice(0, MEMBER_ID_FALLBACK_LENGTH)
  );
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
