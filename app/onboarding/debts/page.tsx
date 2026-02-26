import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { DebtsForm } from "@/app/onboarding/_components/debts-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingDebtsPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={5}
      title="Debts"
      description="Add current liabilities to get an accurate net worth and debt burden profile."
      prevHref="/onboarding/assets"
      nextHref="/onboarding/income-expenses"
    >
      <DebtsForm />
    </OnboardingShell>
  );
}
