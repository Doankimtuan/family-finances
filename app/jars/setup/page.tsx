import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/dictionary";

import {
  bootstrapPresetJarsAction,
  deleteIntentJarAction,
} from "../intent-actions";

import { JarSetupCreateForm } from "../_components/jar-setup-create-form";
import { JarSetupRuleForm } from "../_components/jar-setup-rule-form";

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
  const { householdId, householdLocale, language } = await getAuthenticatedHouseholdContext();
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
  const rules = new Map(
    (rulesResult.data ?? []).map((row) => [row.category_id, row.jar_id]),
  );
  const jarNameMap = new Map(jars.map((jar) => [jar.id, jar.name]));

  return (
    <AppShell
      header={<AppHeader title={t(language, "jars.setup.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 h-8 px-2 text-primary hover:text-primary/80"
            >
              <Link href="/jars">
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t(language, "jars.back_to_jars")}
              </Link>
            </Button>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              {t(language, "jars.setup.header")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {t(language, "jars.setup.description")}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/jars/review">{t(language, "jars.review.open_queue")}</Link>
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
              <CardTitle className="text-lg">{t(language, "jars.setup.preset.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                {t(language, "jars.setup.preset.description")}
              </p>
              <form action={bootstrapPresetJarsAction}>
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/jars/setup?month=${month}`}
                />
                <Button type="submit" className="w-full rounded-xl">
                  {t(language, "jars.setup.preset.action")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{t(language, "jars.setup.custom.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <JarSetupCreateForm
                month={month}
                returnTo={`/jars/setup?month=${month}`}
              />
            </CardContent>
          </Card>
        </div>

        <Card id="rules" className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">{t(language, "jars.setup.rules.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jars.length === 0 ? (
              <EmptyState
                title={t(language, "jars.setup.rules.empty_title")}
                description={t(language, "jars.setup.rules.empty_description")}
                className="min-h-[180px] border-0 bg-transparent p-0"
              />
            ) : (
              <>
                <JarSetupRuleForm
                  categories={categories}
                  jars={jars}
                  returnTo={`/jars/setup?month=${month}#rules`}
                />

                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <div className="grid grid-cols-[1.2fr_1fr] gap-3 border-b border-border/60 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>{t(language, "jars.setup.rules.category")}</span>
                    <span>{t(language, "jars.setup.rules.current_jar")}</span>
                  </div>
                  <div className="divide-y divide-border/50 bg-white">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="grid grid-cols-[1.2fr_1fr] gap-3 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-slate-800">
                          {category.name}
                        </span>
                        <span className="text-slate-600">
                          {rules.has(category.id) ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {jarNameMap.get(rules.get(category.id)!) ??
                                t(language, "jars.setup.rules.unknown_jar")}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {t(language, "jars.setup.rules.unmapped")}
                            </span>
                          )}
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
            <CardTitle className="text-lg">{t(language, "jars.setup.list.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jars.length === 0 ? (
              <EmptyState
                title={t(language, "jars.setup.list.empty_title")}
                description={t(language, "jars.setup.list.empty_description")}
                className="min-h-[180px] border-0 bg-transparent p-0"
              />
            ) : (
              jars.map((jar) => (
                <div
                  key={jar.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {jar.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t(language, `jars.type.${jar.jar_type}`)} · {t(language, `jars.policy.${jar.spend_policy}`)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                    >
                      <Link href={`/jars/${jar.id}`}>{t(language, "common.details")}</Link>
                    </Button>
                    <form action={deleteIntentJarAction}>
                      <input type="hidden" name="jarId" value={jar.id} />
                      <input
                        type="hidden"
                        name="returnTo"
                        value={`/jars/setup?month=${month}`}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        {t(language, "common.delete")}
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
