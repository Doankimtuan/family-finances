import { DashboardCorePanel } from "./_components/dashboard-core-panel";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Family Finances",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-2xl">
        <header className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Household Finance
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Core Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Net worth, cash flow, savings health, emergency runway, and debt pressure.
          </p>
        </header>

        <DashboardCorePanel />
      </section>
    </main>
  );
}
