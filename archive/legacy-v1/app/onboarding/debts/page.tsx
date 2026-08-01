import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { DebtsForm } from "@/app/onboarding/_components/debts-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingDebtsPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={5}
      title="Debts"
      description="Add the debts that still affect your household cash flow and net worth."
      prevHref="/onboarding/assets"
      nextHref="/onboarding/income-expenses"
    >
      <DebtsForm />
    </OnboardingShell>
  );
}
