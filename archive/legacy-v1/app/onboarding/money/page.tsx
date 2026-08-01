import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { AccountsForm } from "@/app/onboarding/_components/accounts-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingAccountsPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={3}
      title="Accounts"
      description="Add the accounts your household actively uses so balances and cash flow stay accurate."
      prevHref="/onboarding/members"
      nextHref="/onboarding/assets"
    >
      <AccountsForm />
    </OnboardingShell>
  );
}
