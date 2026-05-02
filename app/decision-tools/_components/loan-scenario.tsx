"use client";

import React, { useMemo, useState } from "react";
import { formatVndCompact } from "@/lib/dashboard/format";
import { calcLoanScenario } from "../_lib/calculations";
import { LoanScenarioState } from "../_lib/types";
import { Metric, NumericInput, RateInput, ScenarioCard, SimpleLineChart } from "./tool-ui";

export function LoanScenarioCard() {
  const [state, setState] = useState<LoanScenarioState>({
    principal: 1_500_000_000,
    termYears: 20,
    promoRate: 0.08,
    promoMonths: 24,
    floatingRate: 0.115,
    extraPayment: 0,
  });
  const result = useMemo(() => calcLoanScenario(state), [state]);

  return (
    <ScenarioCard
      title="Loan Scenario"
      description="Model promotional-to-floating mortgage payments and payoff timeline."
      scenarioType="loan"
      defaultName="Mortgage Scenario"
      assumptions={state}
      summary={{
        monthly_payment_initial: result.monthlyPaymentInitial,
        monthly_payment_after_switch: result.monthlyPaymentAfterSwitch,
        total_interest: result.totalInterest,
        payoff_months: result.payoffMonths,
      }}
      timeseries={result.series}
      keyMetrics={{
        payment_change:
          result.monthlyPaymentAfterSwitch - result.monthlyPaymentInitial,
        payoff_months: result.payoffMonths,
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NumericInput
          label="Principal (VND)"
          value={state.principal}
          onChange={(v) => setState((p) => ({ ...p, principal: v }))}
        />
        <NumericInput
          label="Term (years)"
          value={state.termYears}
          onChange={(v) =>
            setState((p) => ({ ...p, termYears: Math.max(1, Math.round(v)) }))
          }
        />
        <RateInput
          label="Promo Rate"
          value={state.promoRate}
          onChange={(v) => setState((p) => ({ ...p, promoRate: v }))}
        />
        <NumericInput
          label="Promo Months"
          value={state.promoMonths}
          onChange={(v) =>
            setState((p) => ({ ...p, promoMonths: Math.max(1, Math.round(v)) }))
          }
        />
        <RateInput
          label="Floating Rate"
          value={state.floatingRate}
          onChange={(v) => setState((p) => ({ ...p, floatingRate: v }))}
        />
        <NumericInput
          label="Extra Monthly Payment"
          value={state.extraPayment}
          onChange={(v) =>
            setState((p) => ({ ...p, extraPayment: Math.max(0, v) }))
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Metric
          label="Initial Payment"
          value={formatVndCompact(result.monthlyPaymentInitial)}
        />
        <Metric
          label="After Switch"
          value={formatVndCompact(result.monthlyPaymentAfterSwitch)}
        />
        <Metric
          label="Total Interest"
          value={formatVndCompact(result.totalInterest)}
        />
        <Metric label="Payoff" value={`${result.payoffMonths} mo`} />
      </div>

      <SimpleLineChart
        data={result.series.slice(0, 120)}
        lineA="payment"
        lineB="balance"
        labelA="Payment"
        labelB="Balance"
      />
    </ScenarioCard>
  );
}
