import Link from "next/link";
import { TrendingDown } from "lucide-react";

import { DebtsForm } from "@/app/onboarding/_components/debts-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { formatVnd } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Debts | Family Finances",
};

type DebtRow = {
  id: string;
  name: string;
  liability_type: string;
  current_principal_outstanding: number;
  principal_original: number;
  next_payment_date: string | null;
};

export default async function DebtsPage() {
  const { householdId, language, householdLocale } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const debtsResult = await supabase
    .from("liabilities")
    .select(
      "id, name, liability_type, current_principal_outstanding, principal_original, next_payment_date",
    )
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("current_principal_outstanding", { ascending: false });

  const debts = (debtsResult.data ?? []) as DebtRow[];

  return (
    <AppShell
      header={<AppHeader title={t(language, "debts.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {vi ? "Thêm khoản nợ mới" : "Add New Debt"}
            </h2>
          </div>
          <DebtsForm />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {vi ? "Nghĩa vụ nợ hiện tại" : "Current Liabilities"}
          </h2>

          {debtsResult.error ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              {debtsResult.error.message}
            </div>
          ) : debts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 italic">
              {vi ? "Chưa theo dõi khoản nợ nào. Giữ không nợ hoặc thêm khoản vay ở trên." : "No debts tracked yet. Stay debt-free or add a loan above."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {debts.map((debt) => {
                const progress = debt.principal_original > 0
                  ? Math.round(
                    (1 - debt.current_principal_outstanding / debt.principal_original) * 100,
                  )
                  : 0;
                const liabilityTypeLabel = debt.liability_type === "mortgage"
                  ? (vi ? "Thế chấp" : "Mortgage")
                  : debt.liability_type === "family_loan"
                    ? (vi ? "Vay gia đình" : "Family loan")
                    : debt.liability_type === "personal_loan"
                      ? (vi ? "Vay cá nhân" : "Personal loan")
                      : debt.liability_type === "car_loan"
                        ? (vi ? "Vay mua xe" : "Car loan")
                        : debt.liability_type.replace(/_/g, " ");

                return (
                  <li key={debt.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {debt.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {liabilityTypeLabel}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatVnd(debt.current_principal_outstanding, householdLocale)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {vi ? "còn lại" : "remaining"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{vi ? "Tiến độ trả nợ" : "Payoff Progress"}</span>
                          <span>{progress}% {vi ? "đã trả" : "Paid"}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-rose-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/debts/${debt.id}`}
                        className="inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        {vi ? "Mở chi tiết" : "Open Detail"}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </AppShell>
  );
}
