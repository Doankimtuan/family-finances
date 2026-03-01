import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { AssumptionsForm } from "../_components/assumptions-form";
import { SettingsNav } from "../_components/settings-nav";

export default async function SettingsAssumptionsPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
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
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/assumptions" />

        <Card>
          <CardContent className="p-5">
            <p className="mb-4 text-sm text-slate-600">
              {language === "vi"
                ? "Các giả định này được dùng cho dự báo, công cụ quyết định và mô phỏng mục tiêu dài hạn."
                : "These assumptions are used by forecasts, decision tools, and long-term goal projections."}
            </p>

            {assumptionsResult.error ? (
              <p className="text-sm text-rose-600">
                {language === "vi"
                  ? "Không thể tải giả định:"
                  : "Failed to load assumptions:"}{" "}
                {assumptionsResult.error.message}
              </p>
            ) : !assumptionsResult.data ? (
              <p className="text-sm text-slate-600">
                {language === "vi"
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
      </section>
    </AppShell>
  );
}
