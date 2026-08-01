import {
  DebtVsInvestState,
  GoalModelingState,
  LoanScenarioState,
  PurchaseTimingState,
  SavingsProjectionState,
} from "./types";

export function annuityPayment(
  principal: number,
  monthlyRate: number,
  months: number,
) {
  if (months <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

export function calcLoanScenario(input: LoanScenarioState) {
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

export function calcPurchaseTimingScenario(input: PurchaseTimingState) {
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

export function calcSavingsProjectionScenario(input: SavingsProjectionState) {
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

export function calcGoalModelingScenario(input: GoalModelingState) {
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
  const growthFactor = Math.pow(1 + monthlyRate, months);
  const targetGapAtHorizon =
    input.targetAmount - input.currentAmount * growthFactor;
  const requiredMonthly =
    targetGapAtHorizon <= 0
      ? 0
      : monthlyRate <= 0
        ? Math.ceil(targetGapAtHorizon / months)
        : Math.ceil((targetGapAtHorizon * monthlyRate) / (growthFactor - 1));

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

export function calcDebtVsInvestScenario(input: DebtVsInvestState) {
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

export function inferPrimaryValue(row: Record<string, unknown>) {
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

export function buildComparisonSeries(
  left: any,
  right: any,
) {
  if (!left || !right) return [];
  if (left.scenario_type !== right.scenario_type) return [];

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
