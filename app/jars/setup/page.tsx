import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import {
  bootstrapPresetJarsAction,
  createIntentJarAction,
  deleteIntentJarAction,
  upsertExpenseRuleAction,
} from "../intent-actions";

export const metadata = {
  title: "Jar Setup | Family Finances",
};

export default async function JarSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const { householdId } = await getAuthenticatedHouseholdContext();
  const params = searchParams ? await searchParams : undefined;
  const month =
    params?.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : new Date().toISOString().slice(0, 7);
  const supabase = await createClient();
  const [jarsResult, categoriesResult, rulesResult] = await Promise.all([
    supabase
      .from("jars")
      .select("id, name, slug, jar_type, spend_policy")
      .eq("household_id", householdId)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("kind", "expense")
      .or(`household_id.is.null,household_id.eq.${householdId}`)
      .order("name", { ascending: true }),
    supabase
      .from("jar_rules")
      .select("id, jar_id, category_id")
      .eq("household_id", householdId)
      .eq("rule_type", "expense_category")
      .eq("is_active", true),
  ]);

  const jars = jarsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const rules = new Map((rulesResult.data ?? []).map((row) => [row.category_id, row.jar_id]));
  const jarNameMap = new Map(jars.map((jar) => [jar.id, jar.name]));

  return (
    <AppShell
      header={<AppHeader title="Jar setup" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href="/jars" className="text-sm font-medium text-primary hover:underline">
              ← Quay lại Jars
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Thiết lập hệ hũ</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Tại đây bạn khởi tạo bộ 6 jars mẫu, tạo jars tùy chỉnh, và gắn category chi tiêu
              vào hũ phù hợp để các expense transaction tự giảm đúng hũ.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/jars/review">Mở review queue</Link>
          </Button>
        </div>

        {params?.success ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertDescription>{params.success}</AlertDescription>
          </Alert>
        ) : null}
        {params?.error ? (
          <Alert className="border-rose-200 bg-rose-50 text-rose-900">
            <AlertDescription>{params.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Khởi tạo preset 6 jars</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Dùng bộ 6 jars chuẩn như một điểm bắt đầu. Bạn vẫn có thể thêm, xóa hoặc thay đổi
                kế hoạch tháng sau đó.
              </p>
              <form action={bootstrapPresetJarsAction}>
                <input type="hidden" name="returnTo" value={`/jars/setup?month=${month}`} />
                <Button type="submit" className="w-full">
                  Khởi tạo bộ 6 jars
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Tạo jar tùy chỉnh</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createIntentJarAction} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="returnTo" value={`/jars/setup?month=${month}`} />
                <input type="hidden" name="month" value={month} />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="jar-name">Tên hũ</Label>
                  <Input id="jar-name" name="name" placeholder="VD: Quỹ học cho con" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jar-type">Loại hũ</Label>
                  <select
                    id="jar-type"
                    name="jarType"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue="custom"
                  >
                    <option value="custom">Custom</option>
                    <option value="essential">Essential</option>
                    <option value="investment">Investment / FFA</option>
                    <option value="long_term_saving">Long-term saving</option>
                    <option value="education">Education</option>
                    <option value="play">Play</option>
                    <option value="give">Give</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spend-policy">Policy sử dụng</Label>
                  <select
                    id="spend-policy"
                    name="spendPolicy"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue="flexible"
                  >
                    <option value="flexible">Flexible</option>
                    <option value="invest_only">Invest only</option>
                    <option value="long_term_only">Long-term only</option>
                    <option value="must_spend">Must spend</option>
                    <option value="give_only">Give only</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fixed-amount">Target cố định / tháng</Label>
                  <Input id="fixed-amount" name="fixedAmount" type="number" min="0" defaultValue="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="income-percent">% thu nhập / tháng</Label>
                  <Input id="income-percent" name="incomePercent" type="number" min="0" max="100" step="0.01" defaultValue="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Màu</Label>
                  <Input id="color" name="color" defaultValue="#2563EB" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="icon">Icon</Label>
                  <Input id="icon" name="icon" defaultValue="piggy-bank" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit">Tạo jar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card id="rules" className="border-border/60">
          <CardHeader>
            <CardTitle>Quy tắc category → jar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jars.length === 0 ? (
              <EmptyState
                title="Chưa có jars để map category"
                description="Hãy khởi tạo preset hoặc tạo ít nhất một jar trước."
                className="min-h-[180px] border-0 bg-transparent p-0"
              />
            ) : (
              <>
                <form action={upsertExpenseRuleAction} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="returnTo" value={`/jars/setup?month=${month}#rules`} />
                  <div className="space-y-1.5">
                    <Label htmlFor="categoryId">Expense category</Label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={categories[0]?.id ?? ""}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ruleJarId">Jar</Label>
                    <select
                      id="ruleJarId"
                      name="jarId"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      defaultValue={jars[0]?.id ?? ""}
                    >
                      {jars.map((jar) => (
                        <option key={jar.id} value={jar.id}>
                          {jar.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full sm:w-auto">
                      Lưu rule
                    </Button>
                  </div>
                </form>

                <div className="rounded-2xl border border-border/60">
                  <div className="grid grid-cols-[1.2fr_1fr] gap-3 border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Category</span>
                    <span>Jar hiện tại</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="grid grid-cols-[1.2fr_1fr] gap-3 px-4 py-3 text-sm"
                      >
                        <span className="text-slate-800">{category.name}</span>
                        <span className="text-slate-600">
                          {rules.has(category.id)
                            ? jarNameMap.get(rules.get(category.id)!) ?? "Unknown jar"
                            : "Chưa map"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Jars hiện có</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jars.length === 0 ? (
              <EmptyState
                title="Chưa có jar nào"
                description="Preset và jars tùy chỉnh bạn tạo sẽ hiện ở đây."
                className="min-h-[180px] border-0 bg-transparent p-0"
              />
            ) : (
              jars.map((jar) => (
                <div
                  key={jar.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{jar.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {jar.jar_type} · {jar.spend_policy}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/jars/${jar.id}`}>Xem chi tiết</Link>
                    </Button>
                    <form action={deleteIntentJarAction}>
                      <input type="hidden" name="jarId" value={jar.id} />
                      <input type="hidden" name="returnTo" value={`/jars/setup?month=${month}`} />
                      <Button type="submit" size="sm" variant="ghost">
                        Xóa
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
