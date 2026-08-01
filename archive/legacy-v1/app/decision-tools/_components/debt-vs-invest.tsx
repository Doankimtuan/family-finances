"use client";

import React, { useMemo, useState } from "react";
import { formatVndCompact } from "@/lib/dashboard/format";
import { calcDebtVsInvestScenario } from "../_lib/calculations";
import { DebtVsInvestState } from "../_lib/types";
import { Metric, NumericInput, RateInput, ScenarioCard, SimpleLineChart } from "./tool-ui";

export function DebtVsInvestCard() {
  const [state, setState] = useState<DebtVsInvestState>({
    debtPrincipal: 500_000_000,
    debtRate: 0.11,
    debtYears: 10,
    monthlySurplus: 15_000_000,
    investReturn: 0.1,
    years: 10,
  });
  const result = useMemo(() => calcDebtVsInvestScenario(state), [state]);

  return (
    <ScenarioCard
      title="Debt vs Invest"
      description="Compare aggressive debt payoff against investing surplus over the same horizon."
      scenarioType="debt_vs_invest"
      defaultName="Debt vs Invest"
      assumptions={state}
      summary={{
        networth_aggressive: result.netWorthAggressive,
        networth_invest_first: result.netWorthInvestFirst,
        difference: result.netWorthInvestFirst - result.netWorthAggressive,
      }}
      timeseries={result.series}
      keyMetrics={{
        better_strategy_delta:
          result.netWorthInvestFirst - result.netWorthAggressive,
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NumericInput
          label="Debt Principal"
          value={state.debtPrincipal}
          onChange={(v) => setState((p) => ({ ...p, debtPrincipal: v }))}
        />
        <RateInput
          label="Debt Rate"
          value={state.debtRate}
          onChange={(v) => setState((p) => ({ ...p, debtRate: v }))}
        />
        <NumericInput
          label="Debt Term (years)"
          value={state.debtYears}
          onChange={(v) =>
            setState((p) => ({ ...p, debtYears: Math.max(1, Math.round(v)) }))
          }
        />
        <NumericInput
          label="Monthly Surplus"
          value={state.monthlySurplus}
          onChange={(v) => setState((p) => ({ ...p, monthlySurplus: v }))}
        />
        <RateInput
          label="Invest Return"
          value={state.investReturn}
          onChange={(v) => setState((p) => ({ ...p, investReturn: v }))}
        />
        <NumericInput
          label="Horizon (years)"
          value={state.years}
          onChange={(v) =>
            setState((p) => ({ ...p, years: Math.max(1, Math.round(v)) }))
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Metric
          label="Aggressive Payoff"
          value={formatVndCompact(result.netWorthAggressive)}
        />
        <Metric
          label="Invest First"
          value={formatVndCompact(result.netWorthInvestFirst)}
        />
        <Metric
          label="Difference"
          value={formatVndCompact(
            result.netWorthInvestFirst - result.netWorthAggressive,
          )}
        />
        <Metric
          label="Recommendation"
          value={
            result.netWorthInvestFirst > result.netWorthAggressive
              ? "Invest first"
              : "Pay debt first"
          }
        />
      </div>

      <SimpleLineChart
        data={result.series}
        lineA="aggressive"
        lineB="investFirst"
        labelA="Aggressive"
        labelB="Invest first"
      />
    </ScenarioCard>
  );
}
