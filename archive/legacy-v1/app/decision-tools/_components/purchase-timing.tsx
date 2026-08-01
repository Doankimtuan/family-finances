"use client";

import React, { useMemo, useState } from "react";
import { formatVndCompact } from "@/lib/dashboard/format";
import { calcPurchaseTimingScenario } from "../_lib/calculations";
import { PurchaseTimingState } from "../_lib/types";
import { Metric, NumericInput, RateInput, ScenarioCard, SimpleBarChart } from "./tool-ui";

export function PurchaseTimingCard() {
  const [state, setState] = useState<PurchaseTimingState>({
    currentPrice: 2_500_000_000,
    priceGrowth: 0.06,
    downPaymentRatio: 0.3,
    loanRate: 0.105,
    termYears: 20,
    waitMonths: 12,
    currentSavings: 350_000_000,
    monthlySavings: 25_000_000,
  });
  const result = useMemo(() => calcPurchaseTimingScenario(state), [state]);

  return (
    <ScenarioCard
      title="Purchase Timing"
      description="Compare buy now versus waiting with savings and price growth effects."
      scenarioType="purchase_timing"
      defaultName="Purchase Timing"
      assumptions={state}
      summary={{
        now_monthly_payment: result.nowMonthlyPayment,
        wait_monthly_payment: result.waitMonthlyPayment,
        price_if_wait: result.futurePrice,
        recommendation_delta:
          result.waitMonthlyPayment - result.nowMonthlyPayment,
      }}
      timeseries={result.series}
      keyMetrics={{
        buy_now_monthly: result.nowMonthlyPayment,
        wait_monthly: result.waitMonthlyPayment,
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NumericInput
          label="Current Price (VND)"
          value={state.currentPrice}
          onChange={(v) => setState((p) => ({ ...p, currentPrice: v }))}
        />
        <RateInput
          label="Annual Price Growth"
          value={state.priceGrowth}
          onChange={(v) => setState((p) => ({ ...p, priceGrowth: v }))}
        />
        <RateInput
          label="Down Payment Ratio"
          value={state.downPaymentRatio}
          onChange={(v) => setState((p) => ({ ...p, downPaymentRatio: v }))}
        />
        <RateInput
          label="Loan Rate"
          value={state.loanRate}
          onChange={(v) => setState((p) => ({ ...p, loanRate: v }))}
        />
        <NumericInput
          label="Wait (months)"
          value={state.waitMonths}
          onChange={(v) =>
            setState((p) => ({ ...p, waitMonths: Math.max(0, Math.round(v)) }))
          }
        />
        <NumericInput
          label="Monthly Savings"
          value={state.monthlySavings}
          onChange={(v) => setState((p) => ({ ...p, monthlySavings: v }))}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Metric
          label="Buy Now Payment"
          value={formatVndCompact(result.nowMonthlyPayment)}
        />
        <Metric
          label="Wait Payment"
          value={formatVndCompact(result.waitMonthlyPayment)}
        />
        <Metric
          label="Price if Wait"
          value={formatVndCompact(result.futurePrice)}
        />
        <Metric
          label="Saved DP if Wait"
          value={formatVndCompact(result.futureSavings)}
        />
      </div>

      <SimpleBarChart
        data={result.series}
        barA="buyNowPayment"
        barB="waitPayment"
        labelA="Buy now"
        labelB="Wait"
      />
    </ScenarioCard>
  );
}
