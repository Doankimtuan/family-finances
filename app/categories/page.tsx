import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, Tags, TrendingDown, TrendingUp } from "lucide-react";

import { CategoryActiveToggle } from "./_components/category-active-toggle";
import { CategoryDeleteButton } from "./_components/category-delete-button";
import { CategoryRenameForm } from "./_components/category-rename-form";
import { CreateCategoryForm } from "./_components/create-category-form";

export const metadata = {
  title: "Categories | Family Finances",
};

type CategoryRow = {
  id: string;
  kind: "income" | "expense";
  name: string;
  color: string | null;
  is_system: boolean;
  is_active: boolean;
};

export default async function CategoriesPage() {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const supabase = await createClient();

  const categoriesResult = await supabase
    .from("categories")
    .select("id, kind, name, color, is_system, is_active")
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order("kind", { ascending: true })
    .order("is_system", { ascending: true })
    .order("sort_order", { ascending: true });

  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");

  const hasError = Boolean(categoriesResult.error);

  return (
    <AppShell
      header={<AppHeader title="Categories" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <SectionHeader
              label="Management"
              title="Create Category"
              description="Add household-specific income or expense categories. Categories with transactions cannot be deleted."
            />
          </CardHeader>
          <CardContent>
            <CreateCategoryForm />
          </CardContent>
        </Card>

        <section className="space-y-4">
          <SectionHeader
            label="Expenses"
            title="Expense Categories"
            icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
          />
          <CategorySection
            rows={expenseCategories}
            hasError={hasError}
            kind="expense"
          />
        </section>

        <section className="space-y-4">
          <SectionHeader
            label="Income"
            title="Income Categories"
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          />
          <CategorySection
            rows={incomeCategories}
            hasError={hasError}
            kind="income"
          />
        </section>
      </div>
    </AppShell>
  );
}

function CategorySection({
  rows,
  hasError,
  kind,
}: {
  rows: CategoryRow[];
  hasError: boolean;
  kind: string;
}) {
  if (hasError) {
    return (
      <EmptyState
        icon={Tags}
        title="Could not load categories"
        description="There was a server error fetching your household categories."
        className="bg-destructive/5 border-destructive/20"
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={kind === "expense" ? Tags : PlusCircle}
        title={`No ${kind} categories`}
        description={`You haven't defined any ${kind} categories yet.`}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {rows.map((row) => (
        <Card
          key={row.id}
          className="group hover:border-primary/30 transition-all duration-300 shadow-sm overflow-hidden"
        >
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="p-4 flex items-center gap-4 min-w-0 flex-1">
                <div
                  className="h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: `${row.color ?? "var(--primary)"}20`,
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full shadow-sm"
                    style={{ backgroundColor: row.color ?? "var(--primary)" }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-900">
                    {row.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 items-center">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50 border-slate-200"
                    >
                      {row.is_system ? "System" : "Personal"}
                    </Badge>
                    <Badge
                      variant={row.is_active ? "success" : "secondary"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {row.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 sm:bg-transparent border-t sm:border-t-0 border-slate-100 p-3 sm:p-4 flex items-center justify-between sm:justify-end gap-3 transition-colors group-hover:bg-primary/5 sm:group-hover:bg-transparent">
                <div className="flex items-center gap-1.5">
                  {!row.is_system && (
                    <CategoryActiveToggle
                      categoryId={row.id}
                      currentActive={row.is_active}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <CategoryRenameForm
                    categoryId={row.id}
                    currentName={row.name}
                    currentColor={row.color}
                  />
                  {!row.is_system && (
                    <CategoryDeleteButton categoryId={row.id} />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
