import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { IncomeExpensesForm } from "@/app/onboarding/_components/income-expenses-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingIncomeExpensesPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={6}
      title="Income & Expenses"
      description="Set a simple monthly baseline so cash flow guidance starts from reality."
      prevHref="/onboarding/debts"
      nextHref="/onboarding/first-goal"
    >
      <IncomeExpensesForm />
    </OnboardingShell>
  );
}
