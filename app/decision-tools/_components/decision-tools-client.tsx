"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { saveScenarioAction } from "@/app/decision-tools/actions";
import {
  initialScenarioActionState,
  type ScenarioActionState,
} from "@/app/decision-tools/action-types";
import { formatPercent, formatVndCompact } from "@/lib/dashboard/format";

type SavedScenario = {
  id: string;
  scenario_type: string;
  name: string;
  created_at: string;
  result_computed_at: string | null;
  summary_json: Record<string, unknown> | null;
  timeseries_json: unknown[] | null;
  key_metrics_json: Record<string, unknown> | null;
};

type Props = { savedScenarios: SavedScenario[] };

type TabKey =
  | "loan"
  | "purchase_timing"
  | "savings_projection"
  | "goal_modeling"
  | "debt_vs_invest";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "loan", label: "Loan" },
  { key: "purchase_timing", label: "Purchase Timing" },
  { key: "savings_projection", label: "Savings Projection" },
  { key: "goal_modeling", label: "Goal Modeling" },
  { key: "debt_vs_invest", label: "Debt vs Invest" },
];

export function DecisionToolsClient({ savedScenarios }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("loan");

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "loan" ? <LoanScenarioCard /> : null}
      {activeTab === "purchase_timing" ? <PurchaseTimingCard /> : null}
      {activeTab === "savings_projection" ? <SavingsProjectionCard /> : null}
      {activeTab === "goal_modeling" ? <GoalModelingCard /> : null}
      {activeTab === "debt_vs_invest" ? <DebtVsInvestCard /> : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
              <li key={s.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.scenario_type.replace(/_/g, " ")} ·{" "}
                  {new Date(s.created_at).toLocaleString("en-US")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <ScenarioComparisonCard savedScenarios={savedScenarios} />
    </div>
  );
}

function ScenarioComparisonCard({
  savedScenarios,
}: {
  savedScenarios: SavedScenario[];
}) {
  const comparable = savedScenarios.filter(
    (s) => Array.isArray(s.timeseries_json) && s.timeseries_json.length > 0,
  );
  const [leftId, setLeftId] = useState(comparable[0]?.id ?? "");
  const [rightId, setRightId] = useState(
    comparable[1]?.id ?? comparable[0]?.id ?? "",
  );

  const left = comparable.find((s) => s.id === leftId) ?? null;
  const right = comparable.find((s) => s.id === rightId) ?? null;

  const chartData = buildComparisonSeries(left, right);

  if (comparable.length < 2) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Scenario Comparison
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Save at least two scenarios with computed results to compare
          side-by-side.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Side-by-Side Comparison
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Compare two saved scenarios to identify which path improves your
        outcome.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Scenario A
          </span>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
          >
            {comparable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            Scenario B
          </span>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
          >
            {comparable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ScenarioSummaryBlock scenario={left} />
        <ScenarioSummaryBlock scenario={right} />
      </div>

      {chartData.length > 0 ? (
        <div className="mt-4 h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatVndCompact(v)}
              />
              <Tooltip
                formatter={(value) => formatVndCompact(Number(value ?? 0))}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="left"
                name={left?.name ?? "Scenario A"}
                stroke="#0F766E"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="right"
                name={right?.name ?? "Scenario B"}
                stroke="#C2410C"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Selected scenarios have no comparable timeline points.
        </p>
      )}
    </article>
  );
}

function ScenarioSummaryBlock({
  scenario,
}: {
  scenario: SavedScenario | null;
}) {
  if (!scenario) {
    return (
      <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500">
        No scenario selected.
      </div>
    );
  }

  const metrics = scenario.key_metrics_json ?? {};
  const entries = Object.entries(metrics).slice(0, 3);

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-sm font-semibold text-slate-900">{scenario.name}</p>
      <p className="text-xs text-slate-500">
        {scenario.scenario_type.replace(/_/g, " ")}
      </p>
      <div className="mt-2 space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">No key metrics saved.</p>
        ) : (
          entries.map(([k, v]) => (
            <p key={k} className="text-xs text-slate-700">
              {k.replace(/_/g, " ")}: {formatMetricValue(v)}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function inferPrimaryValue(row: Record<string, unknown>) {
  const candidates = [
    "value",
    "balance",
    "investFirst",
    "aggressive",
    "payment",
    "buyNowPayment",
    "waitPayment",
    "targetLine",
  ];
  for (const key of candidates) {
    const val = Number(row[key]);
    if (Number.isFinite(val)) return val;
  }
  return 0;
}

function formatMetricValue(value: unknown) {
  if (typeof value === "number") {
    if (Math.abs(value) > 1000) return formatVndCompact(value);
    return value.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function buildComparisonSeries(
  left: SavedScenario | null,
  right: SavedScenario | null,
) {
  if (!left || !right) return [];

  const leftSeries = (left.timeseries_json ?? []) as Array<
    Record<string, unknown>
  >;
  const rightSeries = (right.timeseries_json ?? []) as Array<
    Record<string, unknown>
  >;

  const leftMap = new Map<number, number>();
  const rightMap = new Map<number, number>();

  for (const row of leftSeries) {
    const month = Number(row.month);
    leftMap.set(month, inferPrimaryValue(row));
  }
  for (const row of rightSeries) {
    const month = Number(row.month);
    rightMap.set(month, inferPrimaryValue(row));
  }

  const allMonths = Array.from(
    new Set([...leftMap.keys(), ...rightMap.keys()]),
  ).sort((a, b) => a - b);
  return allMonths.map((month) => ({
    month,
    left: leftMap.get(month) ?? null,
    right: rightMap.get(month) ?? null,
  }));
}

function LoanScenarioCard() {
  const [state, setState] = useState({
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

function PurchaseTimingCard() {
  const [state, setState] = useState({
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

function SavingsProjectionCard() {
  const [state, setState] = useState({
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

function GoalModelingCard() {
  const [state, setState] = useState({
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

function DebtVsInvestCard() {
  const [state, setState] = useState({
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

function ScenarioCard({
  title,
  description,
  scenarioType,
  defaultName,
  assumptions,
  summary,
  timeseries,
  keyMetrics,
  children,
}: {
  title: string;
  description: string;
  scenarioType: TabKey;
  defaultName: string;
  assumptions: Record<string, unknown>;
  summary: Record<string, unknown>;
  timeseries: unknown[];
  keyMetrics: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const [name, setName] = useState(defaultName);
  const [saveState, action] = useActionState<ScenarioActionState, FormData>(
    saveScenarioAction,
    initialScenarioActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>

      <form
        className="mt-4 space-y-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          fd.set("scenarioType", scenarioType);
          fd.set("name", name);
          fd.set("assumptionsJson", JSON.stringify(assumptions));
          fd.set("summaryJson", JSON.stringify(summary));
          fd.set("timeseriesJson", JSON.stringify(timeseries));
          fd.set("keyMetricsJson", JSON.stringify(keyMetrics));
          startTransition(() => action(fd));
        }}
      >
        <input type="hidden" name="scenarioType" value={scenarioType} />
        <input type="hidden" name="assumptionsJson" value="{}" />
        <input type="hidden" name="summaryJson" value="{}" />
        <input type="hidden" name="timeseriesJson" value="[]" />
        <input type="hidden" name="keyMetricsJson" value="{}" />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Scenario"}
        </button>
        {saveState.status === "error" && saveState.message ? (
          <p className="text-xs text-rose-600">{saveState.message}</p>
        ) : null}
        {saveState.status === "success" && saveState.message ? (
          <p className="text-xs text-emerald-600">{saveState.message}</p>
        ) : null}
      </form>
    </article>
  );
}

function NumericInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
      <p className="text-[11px] text-slate-500">{formatVndCompact(value)}</p>
    </label>
  );
}

function RateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        step="0.001"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
      <p className="text-[11px] text-slate-500">{formatPercent(value)}</p>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SimpleLineChart({
  data,
  lineA,
  lineB,
  labelA,
  labelB,
}: {
  data: Array<Record<string, number>>;
  lineA: string;
  lineB: string;
  labelA: string;
  labelB: string;
}) {
  if (data.length === 0)
    return (
      <p className="mt-3 text-sm text-slate-500">
        Run this scenario to see projection chart.
      </p>
    );

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatVndCompact(v)}
          />
          <Tooltip
            formatter={(value) => formatVndCompact(Number(value ?? 0))}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={lineA}
            name={labelA}
            stroke="#0F766E"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey={lineB}
            name={labelB}
            stroke="#334155"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleBarChart({
  data,
  barA,
  barB,
  labelA,
  labelB,
}: {
  data: Array<Record<string, number>>;
  barA: string;
  barB: string;
  labelA: string;
  labelB: string;
}) {
  if (data.length === 0)
    return (
      <p className="mt-3 text-sm text-slate-500">
        Run this scenario to see comparison chart.
      </p>
    );

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="#E2E8F0"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatVndCompact(v)}
          />
          <Tooltip
            formatter={(value) => formatVndCompact(Number(value ?? 0))}
          />
          <Legend />
          <Bar
            dataKey={barA}
            name={labelA}
            fill="#0F766E"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey={barB}
            name={labelB}
            fill="#334155"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function annuityPayment(
  principal: number,
  monthlyRate: number,
  months: number,
) {
  if (months <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

function calcLoanScenario(input: {
  principal: number;
  termYears: number;
  promoRate: number;
  promoMonths: number;
  floatingRate: number;
  extraPayment: number;
}) {
  const totalMonths = Math.max(1, input.termYears * 12);
  const series: Array<Record<string, number>> = [];

  let balance = input.principal;
  let totalInterest = 0;
  let month = 0;
  let monthlyPaymentInitial = 0;
  let monthlyPaymentAfterSwitch = 0;

  while (balance > 0 && month < 600) {
    const inPromo = month < input.promoMonths;
    const annualRate = inPromo ? input.promoRate : input.floatingRate;
    const monthlyRate = annualRate / 12;
    const remaining = Math.max(1, totalMonths - month);

    let payment =
      annuityPayment(balance, monthlyRate, remaining) + input.extraPayment;
    const interest = balance * monthlyRate;
    let principalPay = payment - interest;

    if (principalPay <= 0) principalPay = Math.max(0, balance * 0.001);
    if (principalPay > balance) {
      principalPay = balance;
      payment = principalPay + interest;
    }

    balance -= principalPay;
    totalInterest += interest;

    if (month === 0) monthlyPaymentInitial = Math.round(payment);
    if (month === input.promoMonths)
      monthlyPaymentAfterSwitch = Math.round(payment);

    series.push({
      month: month + 1,
      payment: Math.round(payment),
      balance: Math.round(Math.max(0, balance)),
    });
    month += 1;
  }

  return {
    series,
    monthlyPaymentInitial,
    monthlyPaymentAfterSwitch:
      monthlyPaymentAfterSwitch || monthlyPaymentInitial,
    totalInterest: Math.round(totalInterest),
    payoffMonths: month,
  };
}

function calcPurchaseTimingScenario(input: {
  currentPrice: number;
  priceGrowth: number;
  downPaymentRatio: number;
  loanRate: number;
  termYears: number;
  waitMonths: number;
  currentSavings: number;
  monthlySavings: number;
}) {
  const futurePrice =
    input.currentPrice * Math.pow(1 + input.priceGrowth / 12, input.waitMonths);
  const futureSavings =
    input.currentSavings + input.monthlySavings * input.waitMonths;

  const nowLoan = Math.max(
    0,
    input.currentPrice * (1 - input.downPaymentRatio),
  );
  const waitDown = Math.min(futurePrice, futureSavings);
  const waitLoan = Math.max(0, futurePrice - waitDown);

  const months = Math.max(1, input.termYears * 12);
  const monthlyRate = input.loanRate / 12;
  const nowMonthlyPayment = Math.round(
    annuityPayment(nowLoan, monthlyRate, months),
  );
  const waitMonthlyPayment = Math.round(
    annuityPayment(waitLoan, monthlyRate, months),
  );

  return {
    futurePrice: Math.round(futurePrice),
    futureSavings: Math.round(futureSavings),
    nowMonthlyPayment,
    waitMonthlyPayment,
    series: [
      {
        month: 0,
        buyNowPayment: nowMonthlyPayment,
        waitPayment: waitMonthlyPayment,
      },
      {
        month: Math.max(1, input.waitMonths),
        buyNowPayment: nowMonthlyPayment,
        waitPayment: waitMonthlyPayment,
      },
    ],
  };
}

function calcSavingsProjectionScenario(input: {
  startAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  startDelayMonths: number;
}) {
  function runProjection(delayMonths: number) {
    const months = Math.max(1, input.years * 12);
    const monthlyRate = input.annualReturn / 12;
    let value = input.startAmount;
    let contributed = input.startAmount;
    const series: Array<Record<string, number>> = [];

    for (let m = 1; m <= months; m += 1) {
      value *= 1 + monthlyRate;
      if (m > delayMonths) {
        value += input.monthlyContribution;
        contributed += input.monthlyContribution;
      }
      series.push({
        month: m,
        value: Math.round(value),
        contributed: Math.round(contributed),
      });
    }

    return {
      series,
      futureValue: Math.round(value),
      totalContributed: Math.round(contributed),
    };
  }

  const delayed = runProjection(input.startDelayMonths);
  const noDelay = runProjection(0);
  const delayCost = Math.max(0, noDelay.futureValue - delayed.futureValue);

  return {
    series: delayed.series,
    futureValue: delayed.futureValue,
    totalContributed: delayed.totalContributed,
    delayCost,
  };
}

function calcGoalModelingScenario(input: {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  monthsToGoal: number;
}) {
  const months = Math.max(1, input.monthsToGoal);
  const monthlyRate = input.annualReturn / 12;
  const series: Array<Record<string, number>> = [];

  let value = input.currentAmount;
  for (let m = 1; m <= months; m += 1) {
    value = value * (1 + monthlyRate) + input.monthlyContribution;
    series.push({
      month: m,
      value: Math.round(value),
      targetLine: input.targetAmount,
    });
  }

  const projectedValue = Math.round(value);
  const onTrack = projectedValue >= input.targetAmount;
  const remaining = Math.max(0, input.targetAmount - input.currentAmount);
  const requiredMonthly = Math.ceil(
    (remaining * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1 || 1),
  );

  let etaValue = input.currentAmount;
  let etaMonths = 0;
  while (etaValue < input.targetAmount && etaMonths < 600) {
    etaValue = etaValue * (1 + monthlyRate) + input.monthlyContribution;
    etaMonths += 1;
  }

  return {
    series,
    projectedValue,
    onTrack,
    requiredMonthly: Math.max(0, requiredMonthly),
    etaMonths,
  };
}

function calcDebtVsInvestScenario(input: {
  debtPrincipal: number;
  debtRate: number;
  debtYears: number;
  monthlySurplus: number;
  investReturn: number;
  years: number;
}) {
  const months = Math.max(1, input.years * 12);
  const debtMonths = Math.max(1, input.debtYears * 12);

  const debtMonthlyRate = input.debtRate / 12;
  const investMonthlyRate = input.investReturn / 12;
  const baseDebtPayment = annuityPayment(
    input.debtPrincipal,
    debtMonthlyRate,
    debtMonths,
  );

  let debtA = input.debtPrincipal;
  let debtB = input.debtPrincipal;
  let investA = 0;
  let investB = 0;

  const series: Array<Record<string, number>> = [];

  for (let m = 1; m <= months; m += 1) {
    // Strategy A: prepay debt first
    if (debtA > 0) {
      const interest = debtA * debtMonthlyRate;
      const pay = Math.min(
        debtA + interest,
        baseDebtPayment + input.monthlySurplus,
      );
      debtA = Math.max(0, debtA + interest - pay);
    } else {
      investA = investA * (1 + investMonthlyRate) + input.monthlySurplus;
    }

    // Strategy B: invest first, pay normal debt
    if (debtB > 0) {
      const interest = debtB * debtMonthlyRate;
      const pay = Math.min(debtB + interest, baseDebtPayment);
      debtB = Math.max(0, debtB + interest - pay);
    }
    investB = investB * (1 + investMonthlyRate) + input.monthlySurplus;

    const netA = Math.round(investA - debtA);
    const netB = Math.round(investB - debtB);
    series.push({ month: m, aggressive: netA, investFirst: netB });
  }

  const last = series[series.length - 1] ?? { aggressive: 0, investFirst: 0 };

  return {
    series,
    netWorthAggressive: last.aggressive,
    netWorthInvestFirst: last.investFirst,
  };
}
