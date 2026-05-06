import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { AssetsForm } from "@/app/onboarding/_components/assets-form";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export default async function OnboardingAssetsPage() {
  await getAuthenticatedHouseholdContext();

  return (
    <OnboardingShell
      step={4}
      title="Assets"
      description="Record the assets that meaningfully affect your household net worth."
      prevHref="/onboarding/money"
      nextHref="/onboarding/debts"
    >
      <AssetsForm />
    </OnboardingShell>
  );
}
