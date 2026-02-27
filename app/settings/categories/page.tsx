import { CreateCategoryForm } from "@/app/categories/_components/create-category-form";
import { CategoryActiveToggle } from "@/app/categories/_components/category-active-toggle";
import { CategoryDeleteButton } from "@/app/categories/_components/category-delete-button";
import { CategoryRenameForm } from "@/app/categories/_components/category-rename-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
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

function CategorySection({ rows, hasError, language }: { rows: CategoryRow[]; hasError: boolean; language: "en" | "vi" }) {
  const vi = language === "vi";
  if (hasError) {
    return <p className="mt-2 text-sm text-rose-600">{vi ? "Không thể tải danh mục." : "Could not load categories."}</p>;
  }
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-slate-500">{vi ? "Không tìm thấy danh mục." : "No categories found."}</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: row.color ?? "#64748b" }} />
                {row.name}
              </p>
              <p className="text-xs text-slate-500">
                {row.is_system ? (vi ? "Danh mục hệ thống" : "System category") : (vi ? "Danh mục hộ gia đình" : "Household category")} · {row.is_active ? (vi ? "Đang bật" : "Active") : (vi ? "Đã tắt" : "Disabled")}
              </p>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              <CategoryRenameForm categoryId={row.id} currentName={row.name} currentColor={row.color} />
              {!row.is_system ? <CategoryActiveToggle categoryId={row.id} currentActive={row.is_active} /> : null}
              <CategoryDeleteButton categoryId={row.id} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function SettingsCategoriesPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
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
    <AppShell header={<AppHeader title={`${t(language, "settings.title")} · ${t(language, "settings.categories")}`} />} footer={<BottomTabBar />}>
      <section className="space-y-4">
        <SettingsNav currentPath="/settings/categories" />

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{vi ? "Tạo danh mục" : "Create Category"}</h2>
          <p className="mt-1 text-sm text-slate-600">{vi ? "Thêm danh mục thu nhập hoặc chi tiêu riêng cho hộ gia đình." : "Add household-specific income or expense categories."}</p>
          <p className="mt-1 text-xs text-slate-500">{vi ? "Danh mục đã có giao dịch sẽ không thể xóa, nhưng vẫn có thể chỉnh sửa." : "Categories with existing transactions cannot be deleted, but can still be edited."}</p>
          <div className="mt-4">
            <CreateCategoryForm />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{vi ? "Danh mục chi tiêu" : "Expense Categories"}</h2>
          <CategorySection rows={expenseCategories} hasError={Boolean(categoriesResult.error)} language={language} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{vi ? "Danh mục thu nhập" : "Income Categories"}</h2>
          <CategorySection rows={incomeCategories} hasError={Boolean(categoriesResult.error)} language={language} />
        </article>
      </section>
    </AppShell>
  );
}
