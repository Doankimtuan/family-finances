import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { AccountsForm } from "@/app/onboarding/_components/accounts-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingAccountsPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={3}
      title="Accounts"
      description="Add at least one account so cash flow and balances can be tracked correctly."
      prevHref="/onboarding/members"
      nextHref="/onboarding/assets"
    >
      <AccountsForm />
    </OnboardingShell>
  );
}
