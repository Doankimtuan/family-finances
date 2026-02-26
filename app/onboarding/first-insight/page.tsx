import Link from "next/link";

import { OnboardingShell } from "@/app/onboarding/_components/onboarding-shell";
import { formatDate, formatMonths, formatPercent, formatVnd } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingFirstInsightPage() {
  const { householdId, language, householdLocale } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const [metricsResult, goalsResult] = await Promise.all([
    supabase.rpc("rpc_dashboard_core", {
      p_household_id: householdId,
      p_as_of_date: new Date().toISOString().slice(0, 10),
    }),
    supabase
      .from("goals")
      .select("name, target_amount, target_date")
      .eq("household_id", householdId)
      .eq("status", "active")
      .order("priority", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const metrics = metricsResult.data?.[0] ?? null;
  const primaryGoal = goalsResult.data ?? null;

  const insightText = metrics
    ? metrics.monthly_savings > 0
      ? (vi
        ? `Với mức tiết kiệm hàng tháng hiện tại (${formatVnd(metrics.monthly_savings, householdLocale)}), bạn đang tạo được đà tích cực.`
        : `At your current monthly savings (${formatVnd(metrics.monthly_savings, householdLocale)}), you are building positive momentum.`)
      : (vi
        ? "Dòng tiền hàng tháng hiện đang âm. Giảm chi tiêu hoặc tăng thu nhập là hành động có tác động cao nhất."
        : "Your current monthly cash flow is negative. Reducing expenses or increasing income is your highest-impact action.")
    : (vi ? "Hãy thêm dữ liệu trong vài ngày tới để tạo gợi ý sâu hơn." : "Add more data over the next few days to generate richer insights.");

  return (
    <OnboardingShell
      step={8}
      title={vi ? "Gợi ý đầu tiên" : "First Insight"}
      description={vi ? "Bạn đã có bức tranh tài chính hộ gia đình ban đầu." : "You now have an initial household financial picture."}
      prevHref="/onboarding/first-goal"
    >
      {metrics ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Tài sản ròng" : "Net Worth"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(metrics.net_worth, householdLocale)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Tiết kiệm tháng" : "Monthly Savings"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatVnd(metrics.monthly_savings, householdLocale)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Tỷ lệ tiết kiệm" : "Savings Rate"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatPercent(metrics.savings_rate)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Quỹ khẩn cấp" : "Emergency Runway"}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMonths(metrics.emergency_months, householdLocale)}</p>
          </article>
        </div>
      ) : (
        <p className="text-sm text-slate-600">{vi ? "Chưa có chỉ số. Hãy tiếp tục ghi giao dịch và giá trị tài sản." : "No metrics yet. Continue logging transactions and values."}</p>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-700">{insightText}</p>
        {primaryGoal ? (
          <p className="mt-2 text-sm text-slate-600">
            {vi ? "Mục tiêu chính" : "Primary goal"}: <span className="font-medium text-slate-800">{primaryGoal.name}</span>
            {primaryGoal.target_date ? ` ${vi ? "vào" : "by"} ${formatDate(primaryGoal.target_date, householdLocale)}` : ""}
            {` (${vi ? "mục tiêu" : "target"} ${formatVnd(primaryGoal.target_amount, householdLocale)}).`}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {vi ? "Mở Bảng điều khiển" : "Open Dashboard"}
        </Link>
        <Link href="/transactions" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          {vi ? "Ghi giao dịch đầu tiên" : "Log First Transaction"}
        </Link>
      </div>
    </OnboardingShell>
  );
}
