"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  compactMonth,
  formatMonths,
  formatPercent,
  formatVnd,
  formatVndCompact,
} from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import type {
  DashboardCoreResponse,
  DashboardTrendPoint,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type FetchState = "idle" | "loading" | "success" | "error";

function MetricCard({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </>
  );

  const className = cn(
    "block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all",
    href ? "hover:border-teal-300 hover:shadow-md active:scale-[0.99]" : "",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}

function NetWorthTrend({ trend }: { trend: DashboardTrendPoint[] }) {
  const { locale, language } = useI18n();
  const vi = language === "vi";
  const chartData = trend.map((point) => ({
    month: compactMonth(point.month, locale),
    netWorth: Number(point.net_worth),
  }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {vi ? "Thêm dữ liệu theo tháng để thấy rõ xu hướng." : "Add more monthly data to reveal trend direction."}
      </div>
    );
  }

  const latest = chartData[chartData.length - 1]?.netWorth ?? 0;
  const previous = chartData[chartData.length - 2]?.netWorth ?? latest;
  const delta = latest - previous;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            {vi ? "Xu hướng tài sản ròng" : "Net Worth Direction"}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {delta >= 0
              ? (language === "vi" ? "Xu hướng đang tăng. Tiếp tục kế hoạch hiện tại." : "Trend is moving upward. Keep current plan.")
              : (language === "vi" ? "Xu hướng giảm. Kiểm tra chi tiêu và nợ trong tháng này." : "Trend dipped. Inspect spending and liabilities this month.")}
          </p>
        </div>
        <p
          className={`text-sm font-semibold ${delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
        >
          {delta >= 0 ? "+" : ""}
          {formatVndCompact(delta, locale)}
        </p>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
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
              width={80}
              tickFormatter={(value: number) => formatVndCompact(value, locale)}
            />
            <Tooltip
              formatter={(value) => [
                formatVnd(Number(value ?? 0), locale),
                vi ? "Tài sản ròng" : "Net worth",
              ]}
              contentStyle={{ borderRadius: 12, borderColor: "#CBD5E1" }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#0F766E"
              fill="url(#netWorthGradient)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export function DashboardCorePanel() {
  const { locale, language } = useI18n();
  const vi = language === "vi";
  const [state, setState] = useState<FetchState>("idle");
  const [payload, setPayload] = useState<DashboardCoreResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const load = useCallback(async () => {
    const controller = new AbortController();

    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/dashboard/core?months=6`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorBody?.error ?? `Request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as DashboardCoreResponse;
      setPayload(data);
      setState("success");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : vi
            ? "Không thể tải dữ liệu bảng điều khiển."
            : "Failed to load dashboard data.",
      );
      setState("error");
    }

    return () => controller.abort();
  }, [vi]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading" || state === "idle") {
    return (
      <section className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-11 animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section
        className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold text-rose-700">
          {vi ? "Không thể tải dữ liệu bảng điều khiển." : "Could not load dashboard data."}
        </p>
        <p className="mt-1 text-sm text-slate-600">{errorMessage}</p>
        <Button
          variant="destructive"
          onClick={() => void load()}
          className="mt-4"
        >
          {vi ? "Thử lại" : "Retry"}
        </Button>
      </section>
    );
  }

  if (!payload || !payload.metrics) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-slate-800">
          {vi ? "Ảnh chụp tài chính đầu tiên của bạn đang chờ" : "Your first clarity snapshot is waiting"}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          {vi
            ? "Thêm một tài khoản, một khoản chi và một khoản nợ hoặc tài sản để mở khóa bức tranh tài chính đầy đủ."
            : "Add one account, one expense, and one debt or asset to unlock a full household picture."}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="sm">
            <Link href="/accounts">{vi ? "Thêm tài khoản" : "Add Account"}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions">{vi ? "Ghi chi tiêu" : "Log Expense"}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const { metrics, trend } = payload;
  const score = payload.health?.overallScore ?? 0;
  const rawAction = payload.health?.topAction ?? null;
  const action = vi
    ? (rawAction === "This month cash flow is negative. Cut one variable spending category by 10% immediately."
      ? "Dòng tiền tháng này đang âm. Hãy cắt ít nhất một danh mục chi tiêu biến đổi khoảng 10% ngay."
      : rawAction === "Build emergency reserves first. Auto-transfer a fixed amount on salary day this month."
        ? "Ưu tiên xây quỹ khẩn cấp trước. Hãy cài đặt tự động chuyển một khoản cố định vào ngày nhận lương."
        : rawAction === "Debt service is high versus income. Prioritize extra payment on your highest-cost debt."
          ? "Áp lực trả nợ đang cao so với thu nhập. Ưu tiên trả thêm vào khoản nợ có chi phí cao nhất."
          : rawAction === "Goal progress is off track. Increase monthly goal contribution or extend timeline with your partner."
            ? "Tiến độ mục tiêu đang lệch kế hoạch. Tăng đóng góp hàng tháng hoặc giãn timeline cùng người đồng hành."
            : rawAction === "Assets are concentrated. Add one additional asset type to reduce concentration risk over time."
              ? "Tài sản đang tập trung cao. Hãy bổ sung thêm ít nhất một loại tài sản để giảm rủi ro tập trung."
              : rawAction === "Net worth growth is slow. Increase savings rate or reduce high-cost debt to improve trajectory."
                ? "Tăng trưởng tài sản ròng đang chậm. Hãy tăng tỷ lệ tiết kiệm hoặc giảm nợ chi phí cao."
                : rawAction === "Financial health is stable. Keep current habits and review your numbers again next month."
                  ? "Sức khỏe tài chính đang ổn định. Hãy duy trì thói quen hiện tại và rà soát lại số liệu vào tháng sau."
                  : rawAction)
    : rawAction;
  const displayAction = action ?? (vi
    ? "Bổ sung thêm dữ liệu để hệ thống tạo hành động ưu tiên hàng tháng."
    : "Build more data to generate a monthly top action.");

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label={vi ? "Tài sản ròng" : "Net Worth"}
          value={formatVndCompact(Number(metrics.net_worth), locale)}
          note={formatVnd(Number(metrics.net_worth), locale)}
          href="/assets"
        />
        <MetricCard
          label={vi ? "Cân đối tháng" : "Monthly Balance"}
          value={formatVndCompact(Number(metrics.monthly_savings), locale)}
          note={`${vi ? "Thu nhập" : "Income"} ${formatVndCompact(Number(metrics.monthly_income), locale)} ${vi ? "so với chi tiêu" : "vs expense"} ${formatVndCompact(Number(metrics.monthly_expense), locale)}`}
          href="/transactions"
        />
        <MetricCard
          label={vi ? "Điểm tài chính" : "Health Score"}
          value={`${score.toFixed(0)}/100`}
          note={`${vi ? "Quỹ khẩn cấp" : "Emergency"} ${formatMonths(metrics.emergency_months, locale)} · DSR ${formatPercent(metrics.debt_service_ratio)}`}
          href="/debts"
        />
      </div>

      <NetWorthTrend trend={trend} />

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {vi ? "Hành động quan trọng nhất tháng này" : "Most Impactful Action This Month"}
        </p>
        <p className="mt-2 text-sm text-slate-700">{displayAction}</p>
        {payload.health ? (
          <p className="mt-2 text-xs text-slate-500">
            {vi ? "Thành phần" : "Factors"}: {vi ? "dòng tiền" : "cashflow"} {Math.round(payload.health.factorScores.cashflow)}
            , {vi ? "khẩn cấp" : "emergency"} {Math.round(payload.health.factorScores.emergency)},
            {vi ? "nợ" : "debt"} {Math.round(payload.health.factorScores.debt)}, {vi ? "mục tiêu" : "goals"}{" "}
            {Math.round(payload.health.factorScores.goals)}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {vi ? "Diễn giải và truy vết dữ liệu" : "Drill-Down & Explainability"}
        </p>
        <div className="mt-3 space-y-2">
          <details className="group rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              {vi ? "Nguồn dữ liệu tài sản ròng" : "Net Worth Source of Truth"}
            </summary>
            <p className="mt-2 text-xs text-slate-600">
              {vi
                ? "Công thức: Tài sản ròng = tổng dòng tài sản - tổng dòng nợ phải trả"
                : "Formula: Net worth = sum(asset line items) - sum(liability line items)"}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {(payload.drilldowns?.netWorth.assets ?? []).map((row) => (
                <li key={`a-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                  + {row.label}: {formatVnd(row.value, locale)} · <span className="text-slate-500">{row.source}</span>
                </li>
              ))}
              {(payload.drilldowns?.netWorth.liabilities ?? []).map((row) => (
                <li key={`l-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                  - {row.label}: {formatVnd(row.value, locale)} · <span className="text-slate-500">{row.source}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="group rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              {vi ? "Nguồn dữ liệu dòng tiền" : "Cash Flow Source of Truth"}
            </summary>
            <p className="mt-2 text-xs text-slate-600">
              {vi ? "Khoảng tháng" : "Month window"}: {payload.drilldowns?.cashFlow.monthStart} {vi ? "đến" : "to"}{" "}
              {payload.drilldowns?.cashFlow.monthEnd}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{vi ? "Thu nhập" : "Income"}</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-700">
                  {(payload.drilldowns?.cashFlow.income ?? []).map((row) => (
                    <li key={`i-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                      {row.label}: {formatVnd(row.value, locale)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{vi ? "Chi tiêu" : "Expense"}</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-700">
                  {(payload.drilldowns?.cashFlow.expense ?? []).map((row) => (
                    <li key={`e-${row.source}`} className="rounded-lg bg-slate-50 px-2 py-1">
                      {row.label}: {formatVnd(row.value, locale)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <details className="group rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              {vi ? "Diễn giải điểm tài chính" : "Health Score Explainability"}
            </summary>
            {payload.health ? (
              <>
                <p className="mt-2 text-xs text-slate-600">
                  {vi ? "Tổng điểm = tổng có trọng số của các thành phần. Điểm càng cao càng khỏe." : "Overall = weighted sum of factor scores. Higher is healthier."}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {Object.entries(payload.health.factorScores).map(([k, v]) => {
                    const weight =
                      payload.health?.weights[
                        k as keyof typeof payload.health.weights
                      ] ?? 0;
                    const contribution = (v * weight) / 100;
                    return (
                      <li key={k} className="rounded-lg bg-slate-50 px-2 py-1">
                        {k}: {vi ? "điểm" : "score"} {Math.round(v)} × {vi ? "trọng số" : "weight"} {weight}% ={" "}
                        {contribution.toFixed(1)} {vi ? "điểm" : "pts"}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-slate-600">
                  {vi ? "Quy tắc chọn hành động: thành phần cấp bách có điểm thấp nhất được ưu tiên." : "Top action rule: lowest-scoring urgent factor gets prioritized."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-600">{vi ? "Chưa có chi tiết điểm tài chính." : "Health details not available yet."}</p>
            )}
          </details>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {vi ? "Thao tác nhanh" : "Quick Actions"}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild className="w-full">
            <Link href="/transactions">{vi ? "Ghi chi tiêu" : "Log Expense"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/accounts">{vi ? "Tài khoản" : "Accounts"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/categories">{vi ? "Danh mục" : "Categories"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/budgets">{vi ? "Ngân sách" : "Budgets"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/goals">{vi ? "Mục tiêu" : "Goals"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/health">{vi ? "Chi tiết sức khỏe tài chính" : "Health Details"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/insights">{vi ? "Gợi ý" : "Insights"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/decision-tools">{vi ? "Công cụ quyết định" : "Decision Tools"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/reports">{vi ? "Báo cáo" : "Reports"}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full text-black">
            <Link href="/settings">{vi ? "Cài đặt" : "Settings"}</Link>
          </Button>
        </div>
      </article>
    </section>
  );
}
