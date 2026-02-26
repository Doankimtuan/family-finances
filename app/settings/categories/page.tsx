import { CreateCategoryForm } from "@/app/categories/_components/create-category-form";
import { CategoryActiveToggle } from "@/app/categories/_components/category-active-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { SettingsNav } from "../_components/settings-nav";

type CategoryRow = {
  id: string;
  kind: "income" | "expense";
  name: string;
  is_system: boolean;
  is_active: boolean;
};

function CategorySection({ rows, hasError }: { rows: CategoryRow[]; hasError: boolean }) {
  if (hasError) {
    return <p className="mt-2 text-sm text-rose-600">Could not load categories.</p>;
  }
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">No categories found.</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{row.name}</p>
              <p className="text-xs text-slate-500">
                {row.is_system ? "System category" : "Household category"} · {row.is_active ? "Active" : "Disabled"}
              </p>
            </div>
            {!row.is_system ? <CategoryActiveToggle categoryId={row.id} currentActive={row.is_active} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function SettingsCategoriesPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const categoriesResult = await supabase
    .from("categories")
    .select("id, kind, name, is_system, is_active")
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order("kind", { ascending: true })
    .order("is_system", { ascending: false })
    .order("sort_order", { ascending: true });

  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");

  return (
    <AppShell header={<AppHeader title="Settings · Categories" />} footer={<BottomTabBar />}>
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/categories" />

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Create Category</h2>
          <p className="mt-1 text-sm text-slate-600">Add household-specific income or expense categories.</p>
          <div className="mt-4">
            <CreateCategoryForm />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Expense Categories</h2>
          <CategorySection rows={expenseCategories} hasError={Boolean(categoriesResult.error)} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Income Categories</h2>
          <CategorySection rows={incomeCategories} hasError={Boolean(categoriesResult.error)} />
        </article>
      </section>
    </AppShell>
  );
}
