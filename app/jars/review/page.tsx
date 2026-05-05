import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { fetchJarCommandCenter } from "@/lib/jars/intent";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";

import { resolveJarReviewAction } from "../intent-actions";
import { JarManualReviewForm } from "../_components/jar-manual-review-form";

import { t } from "@/lib/i18n/dictionary";

export const metadata = {
  title: "Jar Review Queue | Family Finances",
};

export default async function JarReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const { householdId, householdLocale, language } = await getAuthenticatedHouseholdContext();
  const params = searchParams ? await searchParams : undefined;
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 10);
  const data = await fetchJarCommandCenter(supabase, householdId, month);

  return (
    <AppShell
      header={<AppHeader title={t(language, "jars.review.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 px-2 text-primary hover:text-primary/80">
            <Link href="/goals?tab=jars">
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t(language, "jars.back_to_jars")}
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            {t(language, "jars.review.header")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {t(language, "jars.review.description")}
          </p>
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

        {data.reviews.length === 0 ? (
          <EmptyState
            title={t(language, "jars.review.empty_title")}
            description={t(language, "jars.review.empty_description")}
            className="min-h-[280px] border-border/60 bg-slate-50/60"
            action={
              <Button asChild className="rounded-xl">
                <Link href="/goals?tab=jars">{t(language, "jars.review.back_to_command_center")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {data.reviews.map((review) => (
              <Card key={review.id} className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">
                    {review.source_type} · {review.movement_date}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p>
                      {t(language, "jars.review.total_amount")}:{" "}
                      <span className="font-semibold text-slate-950">
                        {formatVnd(review.amount, householdLocale)}
                      </span>
                    </p>
                    {Object.keys(review.context_json).length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {Object.entries(review.context_json).map(([key, value]) => (
                          <p key={key}>
                            <Label className="font-medium text-slate-500 cursor-default">{key}:</Label>{" "}
                            <span className="text-slate-900">{String(value)}</span>
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {review.suggested_allocations.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <Label className="text-sm font-semibold text-emerald-900 block mb-3">
                        {t(language, "jars.review.suggested_title")}
                      </Label>
                      <div className="space-y-2">
                        {review.suggested_allocations.map((suggestion) => (
                          <div
                            key={`${review.id}-${suggestion.jarId}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{suggestion.jarName}</p>
                              <p className="text-xs text-slate-500">{suggestion.reason}</p>
                            </div>
                            <span className="font-semibold text-slate-950">
                              {formatVndCompact(suggestion.amount, householdLocale)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <form action={resolveJarReviewAction} className="mt-4">
                        <input type="hidden" name="reviewId" value={review.id} />
                        <input type="hidden" name="returnTo" value="/goals/jars/review" />
                        <input type="hidden" name="mode" value="suggested" />
                        <input
                          type="hidden"
                          name="allocationsJson"
                          value={JSON.stringify(
                            review.suggested_allocations.map((item) => ({
                              jarId: item.jarId,
                              amount: item.amount,
                            })),
                          )}
                        />
                        <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                          {t(language, "jars.review.accept_suggestion")}
                        </Button>
                      </form>
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      {t(language, "jars.review.manual_assignment")}
                    </Label>
                    <JarManualReviewForm
                      reviewId={review.id}
                      amount={review.amount}
                      jars={data.items}
                      returnTo="/goals/jars/review"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
