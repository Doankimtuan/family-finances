"use client";

import React, { useMemo, useState } from "react";
import { formatVndCompact } from "@/lib/dashboard/format";
import { calcSavingsProjectionScenario } from "../_lib/calculations";
import { SavingsProjectionState } from "../_lib/types";
import { Metric, NumericInput, RateInput, ScenarioCard, SimpleLineChart } from "./tool-ui";

export function SavingsProjectionCard() {
  const [state, setState] = useState<SavingsProjectionState>({
    startAmount: 100_000_000,
    monthlyContribution: 15_000_000,
    annualReturn: 0.1,
    years: 10,
    startDelayMonths: 0,
  });
  const result = useMemo(() => calcSavingsProjectionScenario(state), [state]);

  return (
    <ScenarioCard
      title="Savings Projection"
      description="Project investment value over time, including delayed start impact."
      scenarioType="savings_projection"
      defaultName="Savings Projection"
      assumptions={state}
      summary={{
        future_value: result.futureValue,
        invested_total: result.totalContributed,
        gain: result.futureValue - result.totalContributed,
      }}
      timeseries={result.series}
      keyMetrics={{
        future_value: result.futureValue,
        delay_cost: result.delayCost,
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NumericInput
          label="Start Amount"
          value={state.startAmount}
          onChange={(v) => setState((p) => ({ ...p, startAmount: v }))}
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
          label="Years"
          value={state.years}
          onChange={(v) =>
            setState((p) => ({ ...p, years: Math.max(1, Math.round(v)) }))
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Metric
          label="Future Value"
          value={formatVndCompact(result.futureValue)}
        />
        <Metric
          label="Contributed"
          value={formatVndCompact(result.totalContributed)}
        />
        <Metric
          label="Net Gain"
          value={formatVndCompact(result.futureValue - result.totalContributed)}
        />
        <Metric label="Delay Cost" value={formatVndCompact(result.delayCost)} />
      </div>

      <SimpleLineChart
        data={result.series}
        lineA="value"
        lineB="contributed"
        labelA="Portfolio"
        labelB="Contributed"
      />
    </ScenarioCard>
  );
}
