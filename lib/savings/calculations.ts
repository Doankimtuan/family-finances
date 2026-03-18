import {
  type SavingsAccountRow,
  type SavingsComputedValue,
  type SavingsProjectionPoint,
  type SavingsWithdrawalRow,
} from "@/lib/savings/types";

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function diffDays(start: string | Date, end: string | Date) {
  const startDate = typeof start === "string" ? toDate(start) : start;
  const endDate = typeof end === "string" ? toDate(end) : end;
  return Math.max(
    0,
    Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000),
  );
}

function roundMoney(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

type SavingsState = {
  principalRemaining: number;
  accruedCarry: number;
  balanceBase: number;
  cursor: string;
  daysElapsed: number;
};

function growSimple(
  principalRemaining: number,
  accruedCarry: number,
  annualRate: number,
  days: number,
) {
  const segmentAccrued = principalRemaining * annualRate * (days / 365);
  return {
    accrued: accruedCarry + segmentAccrued,
    balanceBase: principalRemaining,
  };
}

function growCompound(balanceBase: number, principalRemaining: number, annualRate: number, days: number) {
  const growth = Math.pow(1 + annualRate / 365, days);
  const grownBalance = balanceBase * growth;
  return {
    grownBalance,
    accrued: Math.max(grownBalance - principalRemaining, 0),
  };
}

function capEvaluationDate(account: SavingsAccountRow, asOfDate: string) {
  if (account.term_mode !== "fixed" || !account.maturity_date) return asOfDate;
  return account.maturity_date < asOfDate ? account.maturity_date : asOfDate;
}

function initialState(account: SavingsAccountRow): SavingsState {
  return {
    principalRemaining: account.principal_amount,
    accruedCarry: 0,
    balanceBase: account.principal_amount,
    cursor: account.start_date,
    daysElapsed: 0,
  };
}

function applyGrowth(
  account: SavingsAccountRow,
  state: SavingsState,
  segmentEnd: string,
) {
  const cappedSegmentEnd =
    account.term_mode === "fixed" && account.maturity_date && segmentEnd > account.maturity_date
      ? account.maturity_date
      : segmentEnd;
  const days = diffDays(state.cursor, cappedSegmentEnd);
  if (account.interest_type === "compound_daily") {
    const compound = growCompound(
      state.balanceBase,
      state.principalRemaining,
      account.annual_rate,
      days,
    );
    return {
      ...state,
      balanceBase: compound.grownBalance,
      accruedCarry: compound.accrued,
      cursor: cappedSegmentEnd,
      daysElapsed: state.daysElapsed + days,
    };
  }

  const simple = growSimple(
    state.principalRemaining,
    state.accruedCarry,
    account.annual_rate,
    days,
  );
  return {
    ...state,
    balanceBase: simple.balanceBase,
    accruedCarry: simple.accrued,
    cursor: cappedSegmentEnd,
    daysElapsed: state.daysElapsed + days,
  };
}

function applyWithdrawal(
  account: SavingsAccountRow,
  state: SavingsState,
  withdrawal: SavingsWithdrawalRow,
) {
  const nextPrincipal = withdrawal.remaining_principal_after;
  const remainingAccrued = Math.max(
    state.accruedCarry - withdrawal.gross_interest_amount,
    0,
  );

  return {
    ...state,
    principalRemaining: nextPrincipal,
    accruedCarry: remainingAccrued,
    balanceBase:
      account.interest_type === "compound_daily"
        ? Math.max(
            state.balanceBase -
              withdrawal.requested_principal_amount -
              withdrawal.gross_interest_amount,
            0,
          )
        : nextPrincipal,
    cursor: withdrawal.withdrawal_date,
  };
}

export function computeSavingsCurrentValue(
  account: SavingsAccountRow,
  withdrawals: SavingsWithdrawalRow[],
  asOfDate: string,
): SavingsComputedValue {
  const effectiveAsOf = capEvaluationDate(account, asOfDate);
  let state = initialState(account);
  const sortedWithdrawals = [...withdrawals]
    .filter((row) => row.withdrawal_date <= effectiveAsOf)
    .sort((a, b) => a.withdrawal_date.localeCompare(b.withdrawal_date));

  for (const withdrawal of sortedWithdrawals) {
    state = applyGrowth(account, state, withdrawal.withdrawal_date);
    state = applyWithdrawal(account, state, withdrawal);
    if (state.principalRemaining <= 0) break;
  }

  if (state.principalRemaining > 0) {
    state = applyGrowth(account, state, effectiveAsOf);
  }

  const principal = roundMoney(state.principalRemaining);
  const accruedInterest = roundMoney(Math.max(state.accruedCarry, 0));
  const taxLiability =
    account.savings_type === "third_party"
      ? roundMoney(accruedInterest * account.tax_rate)
      : 0;
  const grossValue = principal + accruedInterest;
  const netValue =
    account.savings_type === "third_party"
      ? grossValue - taxLiability
      : grossValue;

  let liquidationValue = grossValue;
  if (account.savings_type === "bank") {
    if (account.maturity_date && asOfDate < account.maturity_date) {
      const earlyRate = account.early_withdrawal_rate ?? 0;
      const earlyInterest = roundMoney(
        principal * earlyRate * (state.daysElapsed / 365),
      );
      liquidationValue = principal + earlyInterest;
    }
  } else {
    liquidationValue = netValue;
  }

  return {
    principal,
    accruedInterest,
    taxLiability,
    grossValue,
    netValue,
    liquidationValue,
    daysElapsed: state.daysElapsed,
  };
}

export function computeWithdrawalPreview(
  account: SavingsAccountRow,
  computed: SavingsComputedValue,
  requestedPrincipalAmount?: number,
) {
  if (account.savings_type === "bank") {
    const principalPaid = computed.principal;
    const interestPaid = Math.max(computed.liquidationValue - principalPaid, 0);
    const penaltyAmount = Math.max(
      computed.grossValue - computed.liquidationValue,
      0,
    );

    return {
      principalPaid,
      interestPaid,
      taxAmount: 0,
      penaltyAmount,
      netReceived: principalPaid + interestPaid,
      remainingPrincipal: 0,
      mode: "full" as const,
    };
  }

  const principalBefore = Math.max(computed.principal, 0);
  const requestedPrincipal = Math.min(
    Math.max(0, requestedPrincipalAmount ?? principalBefore),
    principalBefore,
  );
  const ratio = principalBefore > 0 ? requestedPrincipal / principalBefore : 0;
  const interestPaid = roundMoney(computed.accruedInterest * ratio);
  const taxAmount = roundMoney(interestPaid * account.tax_rate);
  const netReceived = requestedPrincipal + interestPaid - taxAmount;
  const remainingPrincipal = roundMoney(principalBefore - requestedPrincipal);

  return {
    principalPaid: requestedPrincipal,
    interestPaid,
    taxAmount,
    penaltyAmount: 0,
    netReceived,
    remainingPrincipal,
    mode:
      remainingPrincipal <= 0 ? ("full" as const) : ("partial" as const),
  };
}

export function computeSavingsProjection(
  account: SavingsAccountRow,
  withdrawals: SavingsWithdrawalRow[],
  asOfDate: string,
  projectionDays?: number,
) {
  const baseValue = computeSavingsCurrentValue(account, withdrawals, asOfDate);
  const start = toDate(asOfDate);
  const end =
    account.term_mode === "fixed" && account.maturity_date
      ? toDate(account.maturity_date)
      : new Date(start.getTime() + (projectionDays ?? 365) * 86_400_000);
  const totalDays = diffDays(start, end);
  const principal = baseValue.principal;
  const points: SavingsProjectionPoint[] = [];

  for (let day = 0; day <= totalDays; day += 1) {
    const cursor = new Date(start.getTime() + day * 86_400_000);
    let accrued = 0;
    if (account.interest_type === "compound_daily") {
      accrued = principal * (Math.pow(1 + account.annual_rate / 365, day) - 1);
    } else {
      accrued = principal * account.annual_rate * (day / 365);
    }
    const gross = principal + accrued;
    const tax =
      account.savings_type === "third_party"
        ? accrued * account.tax_rate
        : 0;
    points.push({
      date: toISODate(cursor),
      principal: roundMoney(principal),
      accruedInterest: roundMoney(accrued),
      netValue: roundMoney(gross - tax),
    });
  }

  const lastPoint = points.at(-1) ?? {
    date: asOfDate,
    principal,
    accruedInterest: 0,
    netValue: principal,
  };

  return {
    points,
    maturityValue: lastPoint.principal + lastPoint.accruedInterest,
    taxAmount:
      account.savings_type === "third_party"
        ? roundMoney(lastPoint.accruedInterest * account.tax_rate)
        : 0,
    netReceived: lastPoint.netValue,
    cashComparisonValue: principal,
    effectiveAnnualRate:
      account.interest_type === "compound_daily"
        ? Math.pow(1 + account.annual_rate / 365, 365) - 1
        : account.annual_rate,
  };
}
