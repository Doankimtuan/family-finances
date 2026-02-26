import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { calculateAndPersistHealthSnapshot } from "@/lib/health/service";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Financial Health | Family Finances",
};

const thresholds = {
  cashflow: "<50 fragile · 50-74 improving · >=75 healthy",
  emergency: "<40 urgent · 40-69 building · >=70 resilient",
  debt: "<50 heavy burden · 50-74 manageable · >=75 controlled",
  networth: "<50 slow growth · 50-74 steady · >=75 strong",
  goals: "<50 off-track · 50-74 mixed · >=75 on-track",
  diversification: "<40 concentrated · 40-69 moderate · >=70 diversified",
};

export default async function HealthPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const health = await calculateAndPersistHealthSnapshot(
    supabase,
    householdId,
    new Date().toISOString().slice(0, 10),
  );

  return (
    <AppShell header={<AppHeader title="Financial Health" />} footer={<BottomTabBar />}>
      <div className="space-y-4 pb-20 sm:pb-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Overall Score</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{Math.round(health.overallScore)}/100</p>
          <p className="mt-2 text-sm text-slate-700">{health.topAction}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Factor Breakdown</h2>
          <p className="mt-1 text-sm text-slate-600">Each factor is scored 0-100 with fixed thresholds for explainability.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FactorCard name="Cashflow" score={health.factorScores.cashflow} threshold={thresholds.cashflow} />
            <FactorCard name="Emergency" score={health.factorScores.emergency} threshold={thresholds.emergency} />
            <FactorCard name="Debt" score={health.factorScores.debt} threshold={thresholds.debt} />
            <FactorCard name="Net Worth" score={health.factorScores.networth} threshold={thresholds.networth} />
            <FactorCard name="Goals" score={health.factorScores.goals} threshold={thresholds.goals} />
            <FactorCard name="Diversification" score={health.factorScores.diversification} threshold={thresholds.diversification} />
          </div>
        </article>
      </div>
    </AppShell>
  );
}

function FactorCard({ name, score, threshold }: { name: string; score: number; threshold: string }) {
  return (
    <article className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{name}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{Math.round(score)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-teal-600" style={{ width: `${Math.max(4, Math.min(100, Math.round(score)))}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{threshold}</p>
    </article>
  );
}
