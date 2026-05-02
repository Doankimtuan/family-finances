"use client";

import React, { useMemo, useState } from "react";
import { formatVndCompact } from "@/lib/dashboard/format";
import { calcGoalModelingScenario } from "../_lib/calculations";
import { GoalModelingState } from "../_lib/types";
import { Metric, NumericInput, RateInput, ScenarioCard, SimpleLineChart } from "./tool-ui";

export function GoalModelingCard() {
  const [state, setState] = useState<GoalModelingState>({
    targetAmount: 1_200_000_000,
    currentAmount: 250_000_000,
    monthlyContribution: 20_000_000,
    annualReturn: 0.06,
    monthsToGoal: 36,
  });
  const result = useMemo(() => calcGoalModelingScenario(state), [state]);

  return (
    <ScenarioCard
      title="Goal Modeling"
      description="Check if you are on track and required monthly amount for target date."
      scenarioType="goal_modeling"
      defaultName="Goal Modeling"
      assumptions={state}
      summary={{
        projected_value: result.projectedValue,
        required_monthly: result.requiredMonthly,
        on_track: result.onTrack,
      }}
      timeseries={result.series}
      keyMetrics={{
        eta_months: result.etaMonths,
        required_monthly: result.requiredMonthly,
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NumericInput
          label="Target Amount"
          value={state.targetAmount}
          onChange={(v) => setState((p) => ({ ...p, targetAmount: v }))}
        />
        <NumericInput
          label="Current Amount"
          value={state.currentAmount}
          onChange={(v) => setState((p) => ({ ...p, currentAmount: v }))}
        />
        <NumericInput
          label="Monthly Contribution"
          value={state.monthlyContribution}
          onChange={(v) => setState((p) => ({ ...p, monthlyContribution: v }))}
        />
        <RateInput
          label="Annual Return"
          value={state.annualReturn}
          onChange={(v) => setState((p) => ({ ...p, annualReturn: v }))}
        />
        <NumericInput
          label="Months to Goal"
          value={state.monthsToGoal}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              monthsToGoal: Math.max(1, Math.round(v)),
            }))
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Metric
          label="Projected at Target"
          value={formatVndCompact(result.projectedValue)}
        />
        <Metric
          label="Required / Month"
          value={formatVndCompact(result.requiredMonthly)}
        />
        <Metric label="On Track" value={result.onTrack ? "Yes" : "No"} />
        <Metric label="ETA" value={`${result.etaMonths} mo`} />
      </div>

      <SimpleLineChart
        data={result.series}
        lineA="value"
        lineB="targetLine"
        labelA="Projected"
        labelB="Target"
      />
    </ScenarioCard>
  );
}
