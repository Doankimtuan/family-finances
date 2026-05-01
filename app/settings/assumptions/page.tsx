import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp } from "lucide-react";

import { AssumptionsForm } from "../_components/assumptions-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsAssumptionsPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const assumptionsResult = await supabase
    .from("households")
    .select(
      "assumptions_inflation_annual, assumptions_cash_return_annual, assumptions_investment_return_annual, assumptions_property_growth_annual, assumptions_gold_growth_annual, assumptions_salary_growth_annual",
    )
    .eq("id", householdId)
    .maybeSingle();

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
                label={vi ? "Cài đặt" : "Config"}
                title={vi ? "Giả định tài chính" : "Financial Assumptions"}
                description={
                  vi
                    ? "Dùng cho dự báo, công cụ quyết định và mô phỏng mục tiêu dài hạn."
                    : "Used by forecasts, decision tools, and long-term goal projections."
                }
                icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {assumptionsResult.error ? (
              <p className="text-sm text-rose-600 font-medium">
                {vi ? "Không thể tải giả định:" : "Failed to load assumptions:"}{" "}
                {assumptionsResult.error.message}
              </p>
            ) : !assumptionsResult.data ? (
              <p className="text-sm text-slate-500 italic">
                {vi
                  ? "Chưa có dữ liệu giả định cho hộ gia đình này."
                  : "Assumptions are not available for this household yet."}
              </p>
            ) : (
              <AssumptionsForm
                defaults={{
                  inflationAnnual:
                    Number(
                      assumptionsResult.data.assumptions_inflation_annual ??
                        0.04,
                    ) * 100,
                  cashReturnAnnual:
                    Number(
                      assumptionsResult.data.assumptions_cash_return_annual ??
                        0.03,
                    ) * 100,
                  investmentReturnAnnual:
                    Number(
                      assumptionsResult.data
                        .assumptions_investment_return_annual ?? 0.1,
                    ) * 100,
                  propertyGrowthAnnual:
                    Number(
                      assumptionsResult.data
                        .assumptions_property_growth_annual ?? 0.05,
                    ) * 100,
                  goldGrowthAnnual:
                    Number(
                      assumptionsResult.data.assumptions_gold_growth_annual ??
                        0.04,
                    ) * 100,
                  salaryGrowthAnnual:
                    Number(
                      assumptionsResult.data.assumptions_salary_growth_annual ??
                        0.07,
                    ) * 100,
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
