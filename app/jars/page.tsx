import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { isServerFeatureEnabled } from "@/lib/config/features";
import { createClient } from "@/lib/supabase/server";

import { JarSummaryCards } from "./_components/jar-summary-cards";
import { JarMonthlyOverview } from "./_components/jar-monthly-overview";
import { JarActivityList } from "./_components/jar-activity-list";
import { JarCreateForm } from "./_components/jar-create-form";
import { JarAccountabilityTable } from "./_components/jar-accountability-table";
import { JarCategoryMapTable } from "./_components/jar-category-map-table";
import type { SpendingJarSummaryRow } from "@/lib/jars/spending";

type JarRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
};

type TargetRow = {
  jar_id: string;
  target_mode: "fixed" | "percent";
  target_value: number;
};

type OverviewRow = {
  jar_id: string;
  target_amount: number;
  allocated_amount: number;
  withdrawn_amount: number;
  net_amount: number;
  coverage_ratio: number;
  jar_coverage_ratio_percent: number | null;
};

type EntryRow = {
  id: string;
  entry_date: string;
  entry_type: "allocate" | "withdraw" | "adjust";
  amount: number;
  note: string | null;
  jar: { name: string }[] | null;
};

type ReconciliationRow = {
  id: string;
  category_id: string;
  jar_id: string;
  actual_amount: number;
  allocated_amount: number;
  gap_amount: number;
};

type CategoryRow = {
  id: string;
  name: string;
  kind: "income" | "expense";
};

type SpendingAlertRow = {
  jarId: string;
  alertLevel: "normal" | "warning" | "exceeded";
  usagePercent: number | null;
  spent: number;
  limit: number;
};

function toMonthInput(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function firstDate(monthInput: string): string {
  return `${monthInput}-01`;
}

const DEFAULT_JARS = [
  { name: "Nhu cầu thiết yếu", slug: "necessities", color: "#2563EB", icon: "house", sort_order: 10 },
  { name: "Giáo dục", slug: "education", color: "#0EA5E9", icon: "book-open", sort_order: 20 },
  { name: "Tự do tài chính", slug: "financial-freedom", color: "#16A34A", icon: "trending-up", sort_order: 30 },
  { name: "Tiết kiệm dài hạn", slug: "long-term-savings", color: "#7C3AED", icon: "piggy-bank", sort_order: 40 },
  { name: "Hưởng thụ", slug: "play", color: "#F59E0B", icon: "party-popper", sort_order: 50 },
  { name: "Cho đi", slug: "give", color: "#DC2626", icon: "heart-handshake", sort_order: 60 },
];

export const metadata = {
  title: "Financial Jars | Family Finances",
};

export default async function JarsPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  if (!isServerFeatureEnabled("jars")) {
    redirect("/dashboard");
  }

  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const params = searchParams ? await searchParams : undefined;
  const fallbackMonth = toMonthInput(new Date());
  const selectedMonth = /^\d{4}-\d{2}$/.test(params?.month ?? "")
    ? (params?.month as string)
    : fallbackMonth;
  const monthStart = firstDate(selectedMonth);

  await supabase.from("jar_definitions").upsert(
    DEFAULT_JARS.map((jar) => ({
      household_id: householdId,
      ...jar,
      is_system_default: true,
      is_archived: false,
    })),
    { onConflict: "household_id,slug", ignoreDuplicates: true },
  );

  const [jarsResult, targetResult, overviewResult, entriesResult, reconciliationResult, categoriesResult, spendingSummaryResult, mapResult] =
    await Promise.all([
      supabase
        .from("jar_definitions")
        .select("id, name, slug, color, icon, sort_order")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("jar_monthly_targets")
        .select("jar_id, target_mode, target_value")
        .eq("household_id", householdId)
        .eq("month", monthStart),
      supabase
        .from("jar_monthly_overview")
        .select(
          "jar_id, target_amount, allocated_amount, withdrawn_amount, net_amount, coverage_ratio, jar_coverage_ratio_percent",
        )
        .eq("household_id", householdId)
        .eq("month", monthStart),
      supabase
        .from("jar_ledger_entries")
        .select(
          "id, entry_date, entry_type, amount, note, jar:jar_definitions(name)",
        )
        .eq("household_id", householdId)
        .eq("month", monthStart)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("jar_reconciliation_entries")
        .select("id, category_id, jar_id, actual_amount, allocated_amount, gap_amount")
        .eq("household_id", householdId)
        .eq("month", monthStart)
        .order("gap_amount", { ascending: false }),
      supabase
        .from("categories")
        .select("id, name, kind")
        .or(`household_id.is.null,household_id.eq.${householdId}`),
      supabase.rpc("rpc_spending_jar_monthly_summary", {
        p_household_id: householdId,
        p_month: monthStart,
      }),
      supabase
        .from("spending_jar_category_map")
        .select("category_id, jar_id")
        .eq("household_id", householdId),
    ]);

  const jars = (jarsResult.data ?? []) as JarRow[];
  const targets = (targetResult.data ?? []) as TargetRow[];
  const overviewRows = (overviewResult.data ?? []) as OverviewRow[];
  const entries = (entriesResult.data ?? []) as EntryRow[];
  const reconciliationRows = (reconciliationResult.data ?? []) as ReconciliationRow[];
  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const mapRows = (mapResult.data ?? []) as Array<{
    category_id: string;
    jar_id: string;
  }>;
  const spendingSummaryRows =
    (spendingSummaryResult.data ?? []) as SpendingJarSummaryRow[];

  const targetMap = new Map(targets.map((t) => [t.jar_id, t]));
  const overviewMap = new Map(overviewRows.map((r) => [r.jar_id, r]));
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
  const jarNameMap = new Map(jars.map((jar) => [jar.id, jar.name]));
  const spendingAlertMap = new Map<string, SpendingAlertRow>(
    spendingSummaryRows.map((row) => [
      row.jar_id,
      {
        jarId: row.jar_id,
        alertLevel: row.alert_level,
        usagePercent:
          row.usage_percent === null || row.usage_percent === undefined
            ? null
            : Number(row.usage_percent),
        spent: Number(row.monthly_spent ?? 0),
        limit: Number(row.monthly_limit ?? 0),
      },
    ]),
  );
  const fallbackJarId = jars.find((jar) => jar.slug === "unassigned")?.id ?? null;
  const categoryMappings = new Map(
    mapRows.map((row) => [
      row.category_id,
      {
        categoryId: row.category_id,
        jarId: row.jar_id,
        resolvedFromFallback: false,
      },
    ]),
  );
  const expenseCategories = categories
    .filter((category) => category.kind === "expense")
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const category of expenseCategories) {
    if (!categoryMappings.has(category.id) && fallbackJarId) {
      categoryMappings.set(category.id, {
        categoryId: category.id,
        jarId: fallbackJarId,
        resolvedFromFallback: true,
      });
    }
  }

  const totalAllocated = overviewRows.reduce(
    (sum, row) => sum + Number(row.allocated_amount ?? 0),
    0,
  );
  const totalWithdrawn = overviewRows.reduce(
    (sum, row) => sum + Number(row.withdrawn_amount ?? 0),
    0,
  );
  const netBalance = overviewRows.reduce(
    (sum, row) => sum + Number(row.net_amount ?? 0),
    0,
  );
  const totalTarget = overviewRows.reduce(
    (sum, row) => sum + Number(row.target_amount ?? 0),
    0,
  );
  const coveragePercent = totalTarget > 0 ? (netBalance / totalTarget) * 100 : 0;

  const activityItems = entries.map((entry) => ({
    id: entry.id,
    jar_name: entry.jar?.[0]?.name ?? "Hũ",
    entry_date: entry.entry_date,
    entry_type: entry.entry_type,
    amount: Number(entry.amount),
    note: entry.note,
  }));
  const accountabilityRows = reconciliationRows.map((row) => ({
    id: row.id,
    category_name: categoryNameMap.get(row.category_id) ?? (vi ? "Danh mục" : "Category"),
    jar_name: jarNameMap.get(row.jar_id) ?? (vi ? "Hũ" : "Jar"),
    actual_amount: Number(row.actual_amount),
    allocated_amount: Number(row.allocated_amount),
    gap_amount: Number(row.gap_amount),
  }));

  return (
    <AppShell
      header={<AppHeader title={vi ? "Hũ tài chính" : "Financial Jars"} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <SectionHeader
          label={vi ? "Kế hoạch" : "Planning"}
          title={vi ? "Phân bổ tiền theo hũ" : "Envelope planning with jars"}
          description={
            vi
              ? "Hũ ảo không ảnh hưởng số dư tài khoản. Đặt mục tiêu tháng và phân bổ thủ công."
              : "Virtual jars do not move real account balances. Set monthly targets and allocate manually."
          }
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {vi ? "Tháng hiện tại" : "Current month"}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              defaultValue={selectedMonth}
              name="month"
              form="jar-month-switch"
              className="rounded-lg border px-2 py-1.5 text-sm"
            />
            <form id="jar-month-switch" action="/jars" method="get">
              <button
                className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
                type="submit"
              >
                {vi ? "Xem" : "View"}
              </button>
            </form>
          </div>
        </div>

        <JarSummaryCards
          totalAllocated={totalAllocated}
          totalWithdrawn={totalWithdrawn}
          netBalance={netBalance}
          coveragePercent={coveragePercent}
          locale={householdLocale}
          vi={vi}
        />

        <Card>
          <CardHeader>
            <SectionHeader
              label={vi ? "Tổng quan" : "Overview"}
              title={vi ? "Tiến độ từng hũ" : "Per-jar monthly progress"}
            />
          </CardHeader>
          <CardContent>
        <JarMonthlyOverview
          jars={jars}
          overviewMap={overviewMap}
          targetMap={targetMap}
          spendingAlertMap={spendingAlertMap}
          month={selectedMonth}
          locale={householdLocale}
          vi={vi}
        />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              label={vi ? "Kỷ luật" : "Accountability"}
              title={vi ? "Đối soát hũ và chi tiêu" : "Jar-to-spending reconciliation"}
            />
          </CardHeader>
          <CardContent>
            <JarAccountabilityTable
              rows={accountabilityRows}
              month={selectedMonth}
              locale={householdLocale}
              vi={vi}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              label={vi ? "Liên kết danh mục" : "Category mapping"}
              title={vi ? "Danh mục chi tiêu theo hũ" : "Expense Category to Jar"}
              description={
                vi
                  ? "Mỗi danh mục chi tiêu phải gắn với một hũ. Nếu thiếu map sẽ dùng hũ 'Unassigned'."
                  : "Each expense category maps to one jar. Missing mappings use the 'Unassigned' jar."
              }
            />
          </CardHeader>
          <CardContent>
            <JarCategoryMapTable
              categories={expenseCategories}
              jarOptions={jars}
              mappings={categoryMappings}
              fallbackJarId={fallbackJarId}
              vi={vi}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              label={vi ? "Hoạt động" : "Activity"}
              title={vi ? "Nhật ký giao dịch hũ" : "Jar ledger activity"}
            />
          </CardHeader>
          <CardContent>
            <JarActivityList
              items={activityItems}
              month={selectedMonth}
              locale={householdLocale}
              vi={vi}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              label={vi ? "Thiết lập" : "Setup"}
              title={vi ? "Tạo hũ mới" : "Create new jar"}
              description={
                vi
                  ? "Bạn có thể thêm hũ tùy chỉnh ngoài 6 hũ mặc định."
                  : "Add custom jars in addition to the default 6 jars."
              }
            />
          </CardHeader>
          <CardContent>
            <JarCreateForm vi={vi} />
            <p className="mt-3 text-xs text-muted-foreground">
              {vi ? "Mẹo: Dùng /budgets như màn hình legacy trong lúc chuyển đổi." : "Tip: /budgets remains available as a legacy screen during transition."}
            </p>
            <Link href="/budgets" className="text-xs text-primary hover:underline">
              {vi ? "Mở Budget (legacy)" : "Open Budget (legacy)"}
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
