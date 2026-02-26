import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { WelcomeForm } from "@/app/onboarding/_components/welcome-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingWelcomePage() {
  const context = await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={1}
      title="Welcome"
      description="Set your household identity and locale before adding financial data."
      nextHref="/onboarding/members"
    >
      <WelcomeForm initialHouseholdName={context.householdName ?? "My Household"} />
    </OnboardingShell>
  );
}
