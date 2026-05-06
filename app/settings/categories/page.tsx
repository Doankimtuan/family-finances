import { CreateCategoryForm } from "@/app/categories/_components/create-category-form";
import { CategoryActiveToggle } from "@/app/categories/_components/category-active-toggle";
import { CategoryDeleteButton } from "@/app/categories/_components/category-delete-button";
import { CategoryRenameForm } from "@/app/categories/_components/category-rename-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { SettingsNav } from "../_components/settings-nav";

type CategoryRow = {
  id: string;
  kind: "income" | "expense";
  name: string;
  color: string | null;
  is_system: boolean;
  is_active: boolean;
};

function CategorySection({
  rows,
  hasError,
  language,
}: {
  rows: CategoryRow[];
  hasError: boolean;
  language: "en" | "vi";
}) {
  if (hasError) {
    return (
      <p className="mt-2 text-sm text-destructive">
        {t(language, "settings.could_not_load")}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t(language, "settings.no_categories")}
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded-xl border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: row.color ?? "#64748b" }}
                />
                {row.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.is_system
                  ? t(language, "settings.system_category")
                  : t(language, "settings.household_category")}{" "}
                ·{" "}
                {row.is_active
                  ? t(language, "settings.active")
                  : t(language, "settings.disabled")}
              </p>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              {!row.is_system ? (
                <>
                  <CategoryRenameForm
                    categoryId={row.id}
                    currentName={row.name}
                    currentColor={row.color}
                  />
                  <CategoryActiveToggle
                    categoryId={row.id}
                    currentActive={row.is_active}
                  />
                  <CategoryDeleteButton categoryId={row.id} />
                </>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function SettingsCategoriesPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
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

  return (
    <AppShell
      header={
        <AppHeader
          title={`${t(language, "settings.title")} / ${t(language, "settings.categories")}`}
        />
      }
      footer={<BottomTabBar />}
    >
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/categories" />

        <Card>
          <CardHeader>
            <SectionHeader
              label={t(language, "settings.setup")}
              title={t(language, "settings.create_category")}
              description={t(language, "settings.create_description")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t(language, "settings.category_note")}
            </p>
          </CardHeader>
          <CardContent>
            <CreateCategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              label={t(language, "settings.expenses")}
              title={t(language, "settings.expense_categories")}
            />
          </CardHeader>
          <CardContent>
            <CategorySection
              rows={expenseCategories}
              hasError={Boolean(categoriesResult.error)}
              language={language}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              label={t(language, "settings.income")}
              title={t(language, "settings.income_categories")}
            />
          </CardHeader>
          <CardContent>
            <CategorySection
              rows={incomeCategories}
              hasError={Boolean(categoriesResult.error)}
              language={language}
            />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
