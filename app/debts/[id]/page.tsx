import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatPercent, formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { buildLiabilityProjection } from "@/lib/debts/amortization";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { PayoffChart } from "./_components/payoff-chart";

export const metadata = {
  title: "Debt Detail | Family Finances",
};

type DebtRow = {
  id: string;
  name: string;
  liability_type: string;
  lender_name: string | null;
  principal_original: number;
  current_principal_outstanding: number;
  start_date: string;
  term_months: number | null;
  repayment_method: "annuity" | "equal_principal" | "interest_only" | "flexible" | null;
  promo_rate_annual: number | null;
  promo_months: number | null;
  floating_rate_margin: number | null;
  next_payment_date: string | null;
  relationship_label: string | null;
  notes: string | null;
};

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const { id } = await params;
  const supabase = await createClient();

  const [debtResult, ratesResult, paymentsResult] = await Promise.all([
    supabase
      .from("liabilities")
      .select(
        "id, name, liability_type, lender_name, principal_original, current_principal_outstanding, start_date, term_months, repayment_method, promo_rate_annual, promo_months, floating_rate_margin, next_payment_date, relationship_label, notes",
      )
      .eq("household_id", householdId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("liability_rate_periods")
      .select("period_start, period_end, annual_rate")
      .eq("household_id", householdId)
      .eq("liability_id", id)
      .order("period_start", { ascending: true }),
    supabase
      .from("liability_payments")
      .select("payment_date, actual_amount, principal_component, interest_component")
      .eq("household_id", householdId)
      .eq("liability_id", id)
      .order("payment_date", { ascending: false })
      .limit(6),
  ]);

  const debt = debtResult.data as DebtRow | null;
  if (!debt) {
    notFound();
  }

  const schedule = buildLiabilityProjection({
    startDate: debt.start_date,
    principalOutstanding: Number(debt.current_principal_outstanding),
    termMonths: debt.term_months,
    repaymentMethod: debt.repayment_method,
    promoRateAnnual: debt.promo_rate_annual,
    promoMonths: debt.promo_months,
    floatingRateMargin: debt.floating_rate_margin,
    ratePeriods: (ratesResult.data ?? []).map((row) => ({
      period_start: row.period_start,
      period_end: row.period_end,
      annual_rate: Number(row.annual_rate),
    })),
    horizonMonths: 24,
  });

  const paidRatio = Number(debt.principal_original) > 0
    ? 1 - Number(debt.current_principal_outstanding) / Number(debt.principal_original)
    : 0;
  const payoffPercent = Math.max(0, Math.min(100, Math.round(paidRatio * 100)));

  const nextPayment = schedule[0]?.payment ?? 0;
  const avgRate = schedule.length
    ? schedule.reduce((sum, item) => sum + item.annualRate, 0) / schedule.length
    : Number(debt.promo_rate_annual ?? 0);

  const guidance = debt.liability_type === "family_loan"
    ? "This is a family loan. Keep repayment expectations clear and predictable to protect trust on both sides."
    : debt.liability_type === "mortgage"
      ? "Mortgage with promotional/floating behavior. Keep a stress buffer for rate changes after promo period."
      : "Track principal progress monthly. Small extra payments early can meaningfully shorten debt duration.";

  return (
    <AppShell
      header={<AppHeader title={debt.name} showBack />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Debt Snapshot</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{debt.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {debt.liability_type.replace(/_/g, " ")}
            {debt.lender_name ? ` · ${debt.lender_name}` : ""}
            {debt.relationship_label ? ` · ${debt.relationship_label}` : ""}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Outstanding</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatVndCompact(Number(debt.current_principal_outstanding))}</p>
              <p className="text-xs text-slate-500">{formatVnd(Number(debt.current_principal_outstanding))}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Projected Next Payment</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatVndCompact(nextPayment)}</p>
              <p className="text-xs text-slate-500">Avg annual rate {formatPercent(avgRate)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Payoff Progress</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{payoffPercent}%</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-teal-600" style={{ width: `${payoffPercent}%` }} />
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-700">{guidance}</p>
          {debt.next_payment_date ? (
            <p className="mt-1 text-sm text-slate-600">
              Next payment date: {new Date(debt.next_payment_date).toLocaleDateString("en-US")}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Payoff Projection (24 months)</h2>
          <p className="mt-1 text-sm text-slate-600">Use this to test whether current repayment pace fits household cash flow safely.</p>
          <div className="mt-4">
            <PayoffChart schedule={schedule} />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Payments</h2>
          {paymentsResult.error ? (
            <p className="mt-2 text-sm text-rose-600">{paymentsResult.error.message}</p>
          ) : (paymentsResult.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No payment logs yet. Recording payments improves projection accuracy.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(paymentsResult.data ?? []).map((payment, idx) => (
                <li key={`${payment.payment_date}-${idx}`} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(payment.payment_date).toLocaleDateString("en-US")} · {formatVnd(Number(payment.actual_amount))}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Principal {formatVnd(Number(payment.principal_component))} · Interest {formatVnd(Number(payment.interest_component))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="flex items-center gap-3">
          <Link href="/debts" className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Back to Debts
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
