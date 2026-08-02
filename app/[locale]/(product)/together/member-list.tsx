import { Text } from "@/shared/ui/text";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";

function initials(email: string | null, displayName: string | null): string {
  const source = (displayName ?? email ?? "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Member list row with Avatar (together.members hierarchy).
 */
export function MemberList({
  members,
  youLabel,
  roleAdminLabel,
  rolePartnerLabel,
}: {
  members: HouseholdMemberRow[];
  youLabel: string;
  roleAdminLabel: string;
  rolePartnerLabel: string;
}) {
  return (
    <ul
      className="flex flex-col gap-(--space-2)"
      data-testid="together-members"
    >
      {members.map((member) => (
        <li
          key={member.id}
          className="flex items-center gap-(--space-3) rounded-[var(--radius-lg)] border border-border-subtle bg-surface px-(--space-4) py-(--space-3)"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-text-primary"
            aria-hidden
          >
            {initials(member.email, member.displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <Text size="sm" className="truncate font-medium text-text-primary">
              {member.displayName ?? member.email ?? member.userId.slice(0, 8)}
              {member.isSelf ? (
                <span className="ml-2 text-text-secondary">({youLabel})</span>
              ) : null}
            </Text>
            {member.email && member.displayName ? (
              <Text size="sm" tone="secondary" className="truncate">
                {member.email}
              </Text>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-medium text-text-secondary">
            {member.role === "admin" ? roleAdminLabel : rolePartnerLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}
