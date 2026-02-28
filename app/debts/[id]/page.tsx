import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDate,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { buildLiabilityProjection } from "@/lib/debts/amortization";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { PayoffChart } from "./_components/payoff-chart";
import { RatePhaseChart } from "./_components/rate-phase-chart";
import { RecordPaymentForm } from "./_components/record-payment-form";

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
  repayment_method:
    | "annuity"
    | "equal_principal"
    | "interest_only"
    | "flexible"
    | null;
  promo_rate_annual: number | null;
  promo_months: number | null;
  floating_rate_margin: number | null;
  next_payment_date: string | null;
  relationship_label: string | null;
  notes: string | null;
};

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { householdId, householdLocale, language } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const { id } = await params;
  const supabase = await createClient();

  const [debtResult, ratesResult, paymentsResult, accountsResult] =
    await Promise.all([
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
        .select("period_start, period_end, annual_rate, is_promotional")
        .eq("household_id", householdId)
        .eq("liability_id", id)
        .order("period_start", { ascending: true }),
      supabase
        .from("liability_payments")
        .select(
          "payment_date, actual_amount, principal_component, interest_component",
        )
        .eq("household_id", householdId)
        .eq("liability_id", id)
        .order("payment_date", { ascending: false })
        .limit(6),
      supabase
        .from("accounts")
        .select("id, name")
        .eq("household_id", householdId)
        .eq("is_archived", false),
    ]);

  const accounts = accountsResult.data ?? [];

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
      is_promotional: row.is_promotional,
    })),
    horizonMonths: 24,
  });

  const paidRatio =
    Number(debt.principal_original) > 0
      ? 1 -
        Number(debt.current_principal_outstanding) /
          Number(debt.principal_original)
      : 0;
  const payoffPercent = Math.max(0, Math.min(100, Math.round(paidRatio * 100)));

  const nextPayment = schedule[0]?.payment ?? 0;
  const avgRate = schedule.length
    ? schedule.reduce((sum, item) => sum + item.annualRate, 0) / schedule.length
    : Number(debt.promo_rate_annual ?? 0);
  const promoMonthsInProjection = schedule.filter(
    (row) => row.phase === "promo",
  ).length;
  const floatingStartPoint = schedule.find((row) => row.phase === "floating");
  const floatingStartPayment = floatingStartPoint?.payment ?? null;
  const promoStartPayment =
    schedule.find((row) => row.phase === "promo")?.payment ?? null;
  const switchDelta =
    floatingStartPayment !== null && promoStartPayment !== null
      ? floatingStartPayment - promoStartPayment
      : null;

  const liabilityTypeLabel =
    debt.liability_type === "family_loan"
      ? vi
        ? "Vay gia đình"
        : "Family loan"
      : debt.liability_type === "mortgage"
        ? "Mortgage"
        : debt.liability_type === "personal_loan"
          ? vi
            ? "Vay cá nhân"
            : "Personal loan"
          : debt.liability_type === "car_loan"
            ? vi
              ? "Vay mua xe"
              : "Car loan"
            : debt.liability_type.replace(/_/g, " ");

  const guidance =
    debt.liability_type === "family_loan"
      ? vi
        ? "Đây là khoản vay gia đình. Hãy giữ kỳ vọng trả nợ rõ ràng và nhất quán để bảo vệ niềm tin đôi bên."
        : "This is a family loan. Keep repayment expectations clear and predictable to protect trust on both sides."
      : debt.liability_type === "mortgage"
        ? vi
          ? "Khoản thế chấp có giai đoạn ưu đãi và thả nổi. Hãy duy trì quỹ đệm cho rủi ro lãi suất sau ưu đãi."
          : "Mortgage with promotional/floating behavior. Keep a stress buffer for rate changes after promo period."
        : vi
          ? "Theo dõi tiến độ gốc hàng tháng. Trả thêm sớm dù nhỏ vẫn có thể rút ngắn đáng kể thời gian trả nợ."
          : "Track principal progress monthly. Small extra payments early can meaningfully shorten debt duration.";

  return (
    <AppShell
      header={<AppHeader title={debt.name} showBack />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-4 pb-20 sm:pb-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              {vi ? "Tổng quan khoản nợ" : "Debt Snapshot"}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {debt.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {liabilityTypeLabel}
              {debt.lender_name ? ` · ${debt.lender_name}` : ""}
              {debt.relationship_label ? ` · ${debt.relationship_label}` : ""}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {vi ? "Dư nợ hiện tại" : "Outstanding"}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatVndCompact(
                    Number(debt.current_principal_outstanding),
                    householdLocale,
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {formatVnd(
                    Number(debt.current_principal_outstanding),
                    householdLocale,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {vi ? "Khoản trả kỳ tới (dự kiến)" : "Projected Next Payment"}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatVndCompact(nextPayment, householdLocale)}
                </p>
                <p className="text-xs text-slate-500">
                  {vi ? "Lãi suất năm TB" : "Avg annual rate"}{" "}
                  {formatPercent(avgRate)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {vi ? "Tiến độ trả nợ" : "Payoff Progress"}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {payoffPercent}%
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-teal-600"
                    style={{ width: `${payoffPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-700">{guidance}</p>
            {debt.next_payment_date ? (
              <p className="mt-1 text-sm text-slate-600">
                {vi ? "Ngày thanh toán tiếp theo" : "Next payment date"}:{" "}
                {formatDate(debt.next_payment_date, householdLocale)}
              </p>
            ) : null}
            {debt.liability_type === "mortgage" ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {vi
                    ? "Tác động từ ưu đãi sang thả nổi"
                    : "Promo to Floating Impact"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {vi
                    ? "Số tháng ưu đãi trong dự phóng"
                    : "Promo phase in projection"}
                  : {promoMonthsInProjection} {vi ? "tháng" : "months"}
                  {floatingStartPoint
                    ? ` · ${vi ? "Thả nổi bắt đầu" : "Floating starts"} ${formatDate(floatingStartPoint.month, householdLocale, { month: "short", year: "numeric" })}`
                    : ""}
                </p>
                {switchDelta !== null ? (
                  <p
                    className={`mt-1 text-sm font-medium ${switchDelta > 0 ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {vi
                      ? "Biến động khoản trả khi chuyển pha"
                      : "Payment change at switch"}
                    : {switchDelta > 0 ? "+" : ""}
                    {formatVnd(switchDelta, householdLocale)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-emerald-900">
              {vi ? "Ghi nhận thanh toán" : "Record Payment"}
            </h2>
            <p className="mb-4 text-sm text-emerald-700">
              {vi
                ? "Ghi nhận các khoản trả nợ để cập nhật dư nợ và theo dõi tiến độ chính xác."
                : "Log repayments to update outstanding balance and track progress accurately."}
            </p>
            <RecordPaymentForm liabilityId={id} accounts={accounts} vi={vi} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {vi
                ? "Dự phóng trả nợ (24 tháng)"
                : "Payoff Projection (24 months)"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {vi
                ? "Dùng phần này để kiểm tra nhịp độ trả nợ hiện tại có phù hợp an toàn với dòng tiền gia đình hay không."
                : "Use this to test whether current repayment pace fits household cash flow safely."}
            </p>
            <div className="mt-4">
              <PayoffChart schedule={schedule} />
            </div>
            <div className="mt-4">
              <RatePhaseChart schedule={schedule} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {vi
                ? "Lịch trả nợ gốc/lãi (12 tháng tới)"
                : "Amortization Schedule (Next 12 months)"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {vi
                ? "Bảng này cho thấy khi nào lãi suất đổi pha và tỷ trọng gốc/lãi thay đổi theo tháng."
                : "This shows when rate phases change and how principal vs interest shifts monthly."}
            </p>
            {schedule.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                {vi ? "Chưa có dữ liệu dự phóng." : "No projection available."}
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <th className="px-2 py-2">{vi ? "Tháng" : "Month"}</th>
                      <th className="px-2 py-2">{vi ? "Pha" : "Phase"}</th>
                      <th className="px-2 py-2">{vi ? "Lãi suất" : "Rate"}</th>
                      <th className="px-2 py-2">
                        {vi ? "Thanh toán" : "Payment"}
                      </th>
                      <th className="px-2 py-2">{vi ? "Gốc" : "Principal"}</th>
                      <th className="px-2 py-2">{vi ? "Lãi" : "Interest"}</th>
                      <th className="px-2 py-2">{vi ? "Dư nợ" : "Balance"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.slice(0, 12).map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-slate-100 text-slate-700"
                      >
                        <td className="px-2 py-2">
                          {formatDate(row.month, householdLocale, {
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-2 py-2">
                          {row.phase === "promo"
                            ? vi
                              ? "Ưu đãi"
                              : "Promo"
                            : row.phase === "floating"
                              ? vi
                                ? "Thả nổi"
                                : "Floating"
                              : vi
                                ? "Thiết lập"
                                : "Configured"}
                        </td>
                        <td className="px-2 py-2">
                          {formatPercent(row.annualRate)}
                        </td>
                        <td className="px-2 py-2">
                          {formatVndCompact(row.payment, householdLocale)}
                        </td>
                        <td className="px-2 py-2">
                          {formatVndCompact(row.principal, householdLocale)}
                        </td>
                        <td className="px-2 py-2">
                          {formatVndCompact(row.interest, householdLocale)}
                        </td>
                        <td className="px-2 py-2">
                          {formatVndCompact(row.balance, householdLocale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {vi ? "Thanh toán gần đây" : "Recent Payments"}
            </h2>
            {paymentsResult.error ? (
              <p className="mt-2 text-sm text-rose-600">
                {paymentsResult.error.message}
              </p>
            ) : (paymentsResult.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                {vi
                  ? "Chưa có nhật ký thanh toán. Ghi nhận thanh toán giúp tăng độ chính xác của dự phóng."
                  : "No payment logs yet. Recording payments improves projection accuracy."}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(paymentsResult.data ?? []).map((payment, idx) => (
                  <li
                    key={`${payment.payment_date}-${idx}`}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(payment.payment_date, householdLocale)} ·{" "}
                      {formatVnd(
                        Number(payment.actual_amount),
                        householdLocale,
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {vi ? "Gốc" : "Principal"}{" "}
                      {formatVnd(
                        Number(payment.principal_component),
                        householdLocale,
                      )}{" "}
                      · {vi ? "Lãi" : "Interest"}{" "}
                      {formatVnd(
                        Number(payment.interest_component),
                        householdLocale,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Link
            href="/debts"
            className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            {vi ? "Quay lại Nợ" : "Back to Debts"}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
