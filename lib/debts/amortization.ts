export type LiabilityRatePeriod = {
  period_start: string;
  period_end: string | null;
  annual_rate: number;
};

export type LiabilityProjectionInput = {
  startDate: string;
  principalOutstanding: number;
  termMonths: number | null;
  repaymentMethod: "annuity" | "equal_principal" | "interest_only" | "flexible" | null;
  promoRateAnnual: number | null;
  promoMonths: number | null;
  floatingRateMargin: number | null;
  ratePeriods: LiabilityRatePeriod[];
  horizonMonths?: number;
};

export type LiabilityProjectionPoint = {
  month: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  annualRate: number;
};

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function monthDiff(a: Date, b: Date) {
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function pickRateAnnual(input: LiabilityProjectionInput, monthDate: Date, monthOffsetFromStart: number) {
  const iso = toIsoDate(monthDate);

  for (const period of input.ratePeriods) {
    const isAfterStart = iso >= period.period_start;
    const isBeforeEnd = !period.period_end || iso <= period.period_end;
    if (isAfterStart && isBeforeEnd) {
      return Number(period.annual_rate);
    }
  }

  const promoMonths = input.promoMonths ?? 0;
  if (input.promoRateAnnual !== null && input.promoRateAnnual !== undefined && monthOffsetFromStart < promoMonths) {
    return Number(input.promoRateAnnual);
  }

  if (input.promoRateAnnual !== null && input.promoRateAnnual !== undefined) {
    return Number(input.promoRateAnnual) + Number(input.floatingRateMargin ?? 0);
  }

  return 0;
}

export function buildLiabilityProjection(input: LiabilityProjectionInput): LiabilityProjectionPoint[] {
  const horizon = Math.max(1, Math.min(input.horizonMonths ?? 24, 360));
  const start = monthStart(new Date(input.startDate));
  const now = monthStart(new Date());
  const elapsed = Math.max(0, monthDiff(start, now));

  let remainingMonths = input.termMonths ? Math.max(1, input.termMonths - elapsed) : 120;
  const totalMonthsToProject = Math.min(horizon, remainingMonths);

  let balance = Math.max(0, input.principalOutstanding);
  const schedule: LiabilityProjectionPoint[] = [];

  for (let i = 0; i < totalMonthsToProject; i += 1) {
    if (balance <= 0) break;

    const date = addMonths(now, i);
    const monthOffsetFromStart = monthDiff(start, date);
    const annualRate = pickRateAnnual(input, date, monthOffsetFromStart);
    const monthlyRate = annualRate / 12;

    let payment = 0;
    let principalComponent = 0;
    const interestComponent = Math.round(balance * monthlyRate);

    const method = input.repaymentMethod ?? "annuity";

    if (method === "annuity") {
      if (monthlyRate <= 0) {
        payment = Math.round(balance / remainingMonths);
      } else {
        const factor = Math.pow(1 + monthlyRate, remainingMonths);
        payment = Math.round(balance * ((monthlyRate * factor) / (factor - 1)));
      }
      principalComponent = Math.max(0, payment - interestComponent);
    } else if (method === "equal_principal") {
      principalComponent = Math.round(balance / remainingMonths);
      payment = principalComponent + interestComponent;
    } else if (method === "interest_only") {
      if (remainingMonths === 1) {
        principalComponent = Math.round(balance);
      }
      payment = interestComponent + principalComponent;
    } else {
      // Non-obvious: "flexible" and informal family loans are projected with equal-principal fallback
      // to provide a realistic runway while keeping assumptions transparent.
      principalComponent = Math.round(balance / remainingMonths);
      payment = principalComponent + interestComponent;
    }

    principalComponent = Math.min(principalComponent, Math.round(balance));
    balance = Math.max(0, Math.round(balance - principalComponent));

    schedule.push({
      month: toIsoDate(date),
      payment,
      principal: principalComponent,
      interest: interestComponent,
      balance,
      annualRate,
    });

    remainingMonths = Math.max(1, remainingMonths - 1);
  }

  return schedule;
}
