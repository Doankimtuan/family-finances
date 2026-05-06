import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { t } from "@/lib/i18n/dictionary";
import { getSettingsDataContext } from "@/lib/server/settings-data";
import { TrendingUp } from "lucide-react";

import { AssumptionsForm } from "../_components/assumptions-form";
import { SettingsNav } from "../_components/settings-nav";
import { DEFAULT_ASSUMPTIONS } from "../constants/assumptions";

export default async function SettingsAssumptionsPage() {
  const { language, assumptions } = await getSettingsDataContext(false, false, true);

  return (
    <AppShell
      header={
        <AppHeader
          title={`${t(language, "settings.title")} / ${t(language, "settings.assumptions")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SettingsNav currentPath="/settings/assumptions" />

        <Card className="border-blue-100 shadow-sm overflow-hidden">
          <CardHeader className="p-0">
            <div className="p-5 border-b border-blue-50 bg-blue-50/30">
              <SectionHeader
                label={t(language, "settings.config")}
                title={t(language, "settings.financial_assumptions")}
                description={t(language, "settings.assumptions_description")}
                icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!assumptions ? (
              <p className="text-sm text-slate-500 italic">
                {t(language, "settings.no_assumptions")}
              </p>
            ) : (
              <AssumptionsForm
                defaults={{
                  inflationAnnual:
                    Number(assumptions.assumptions_inflation_annual ?? DEFAULT_ASSUMPTIONS.INFLATION_ANNUAL) * 100,
                  cashReturnAnnual:
                    Number(assumptions.assumptions_cash_return_annual ?? DEFAULT_ASSUMPTIONS.CASH_RETURN_ANNUAL) * 100,
                  investmentReturnAnnual:
                    Number(assumptions.assumptions_investment_return_annual ?? DEFAULT_ASSUMPTIONS.INVESTMENT_RETURN_ANNUAL) * 100,
                  propertyGrowthAnnual:
                    Number(assumptions.assumptions_property_growth_annual ?? DEFAULT_ASSUMPTIONS.PROPERTY_GROWTH_ANNUAL) * 100,
                  goldGrowthAnnual:
                    Number(assumptions.assumptions_gold_growth_annual ?? DEFAULT_ASSUMPTIONS.GOLD_GROWTH_ANNUAL) * 100,
                  salaryGrowthAnnual:
                    Number(assumptions.assumptions_salary_growth_annual ?? DEFAULT_ASSUMPTIONS.SALARY_GROWTH_ANNUAL) * 100,
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
