import { ArrowLeftRight } from "lucide-react";

import { IncomeExpensesForm } from "@/app/onboarding/_components/income-expenses-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export const metadata = {
  title: "Cash Flow Baselines | Family Finances",
};

export default async function CashFlowSettingsPage() {
  const { language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell
      header={<AppHeader title={t(language, "settings.cash_flow")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {t(language, "settings.cash_flow_title")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t(language, "settings.cash_flow_description")}
            </p>
            <IncomeExpensesForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
