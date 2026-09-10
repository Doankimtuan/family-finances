import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import { Card } from "@/shared/patterns/card";
import { TogetherMemberRow } from "./together-member-row";

type TogetherMemberPreviewProps = {
  members: HouseholdMemberRow[];
  youLabel: string;
  unnamedFallback: string;
  roleAdminLabel: string;
  rolePartnerLabel: string;
  roleAdminHint: string;
  rolePartnerHint: string;
};

export function TogetherMemberPreview({
  members,
  youLabel,
  unnamedFallback,
  roleAdminLabel,
  rolePartnerLabel,
  roleAdminHint,
  rolePartnerHint,
}: TogetherMemberPreviewProps) {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <ul
        className="divide-y divide-divider"
        data-testid="together-member-preview"
      >
        {members.map((member) => (
          <TogetherMemberRow
            key={member.id}
            member={member}
            youLabel={youLabel}
            unnamedFallback={unnamedFallback}
            roleAdminLabel={roleAdminLabel}
            rolePartnerLabel={rolePartnerLabel}
            roleAdminHint={roleAdminHint}
            rolePartnerHint={rolePartnerHint}
          />
        ))}
      </ul>
    </Card>
  );
}
