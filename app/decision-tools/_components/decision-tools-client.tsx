"use client";

import { useState } from "react";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SavedScenario, TabKey } from "../_lib/types";
import { LoanScenarioCard } from "./loan-scenario";
import { PurchaseTimingCard } from "./purchase-timing";
import { SavingsProjectionCard } from "./savings-projection";
import { GoalModelingCard } from "./goal-modeling";
import { DebtVsInvestCard } from "./debt-vs-invest";
import { ScenarioComparisonCard } from "./scenario-comparison";

type Props = { savedScenarios: SavedScenario[] };

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "loan", label: "Loan" },
  { key: "purchase_timing", label: "Purchase Timing" },
  { key: "savings_projection", label: "Savings Projection" },
  { key: "goal_modeling", label: "Goal Modeling" },
  { key: "debt_vs_invest", label: "Debt vs Invest" },
];

export function DecisionToolsClient({ savedScenarios }: Props) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>("loan");

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="w-full"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-slate-100 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-lg px-3 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4 space-y-4">
          <TabsContent value="loan" className="mt-0">
            <LoanScenarioCard />
          </TabsContent>
          <TabsContent value="purchase_timing" className="mt-0">
            <PurchaseTimingCard />
          </TabsContent>
          <TabsContent value="savings_projection" className="mt-0">
            <SavingsProjectionCard />
          </TabsContent>
          <TabsContent value="goal_modeling" className="mt-0">
            <GoalModelingCard />
          </TabsContent>
          <TabsContent value="debt_vs_invest" className="mt-0">
            <DebtVsInvestCard />
          </TabsContent>
        </div>
      </Tabs>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Saved Scenarios
          </h2>
          {savedScenarios.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No saved scenarios yet. Run one calculation and save it.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {savedScenarios.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.scenario_type.replace(/_/g, " ")} ·{" "}
                    {new Date(s.created_at).toLocaleString(locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ScenarioComparisonCard savedScenarios={savedScenarios} />
    </div>
  );
}
