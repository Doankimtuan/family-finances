import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { DebtsContent } from "./_components/debts-content";
import { DebtsSkeleton } from "./_components/debts-skeleton";

export const metadata = {
  title: "Debts | Family Finances",
};

export default async function DebtsPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";

  return (
    <AppShell
      header={<AppHeader title={t(language, "debts.title")} />}
      footer={<BottomTabBar />}
    >
      <Suspense fallback={<DebtsSkeleton />}>
        <DebtsContent
          householdId={householdId}
          vi={vi}
          householdLocale={householdLocale}
        />
      </Suspense>
    </AppShell>
  );
}
