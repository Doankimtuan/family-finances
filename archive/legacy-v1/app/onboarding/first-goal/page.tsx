import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { FirstGoalForm } from "@/app/onboarding/_components/first-goal-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingFirstGoalPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={7}
      title="First Goal"
      description="Choose one clear target so progress and recommendations have direction."
      prevHref="/onboarding/income-expenses"
      nextHref="/onboarding/first-insight"
    >
      <FirstGoalForm />
    </OnboardingShell>
  );
}
