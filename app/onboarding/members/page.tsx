import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { MembersForm } from "@/app/onboarding/_components/members-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingMembersPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={2}
      title="Members"
      description="Invite your partner so both of you share the same financial reality."
      prevHref="/onboarding/welcome"
      nextHref="/onboarding/accounts"
    >
      <MembersForm />
    </OnboardingShell>
  );
}
