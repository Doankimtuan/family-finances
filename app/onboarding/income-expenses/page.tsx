import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { IncomeExpensesForm } from "@/app/onboarding/_components/income-expenses-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingIncomeExpensesPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={6}
      title="Income & Expenses"
      description="Set monthly baseline income and essential expenses to seed cash flow forecasting."
      prevHref="/onboarding/debts"
      nextHref="/onboarding/first-goal"
    >
      <IncomeExpensesForm />
    </OnboardingShell>
  );
}
