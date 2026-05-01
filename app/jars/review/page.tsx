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
  const { householdId, householdLocale } = await getAuthenticatedHouseholdContext();
  const params = searchParams ? await searchParams : undefined;
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 10);
  const data = await fetchJarCommandCenter(supabase, householdId, month);

  return (
    <AppShell
      header={<AppHeader title="Review queue" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 px-2 text-primary hover:text-primary/80">
            <Link href="/jars">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Quay lại Jars
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Review queue cho jars</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Những transaction hoặc savings event chưa đủ chắc chắn sẽ dừng ở đây. Bạn có thể chấp
            nhận gợi ý của hệ thống hoặc gán lại thủ công vào đúng hũ.
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
            title="Review queue đang trống"
            description="Hiện chưa có movement nào cần bạn xác nhận. Khi thu nhập mới hoặc savings event chưa map được, chúng sẽ xuất hiện ở đây."
            className="min-h-[280px] border-border/60 bg-slate-50/60"
            action={
              <Button asChild className="rounded-xl">
                <Link href="/jars">Quay lại command center</Link>
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
                      Tổng amount: <span className="font-semibold text-slate-950">
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
                        Gợi ý hiện tại từ hệ thống
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
                        <input type="hidden" name="returnTo" value="/jars/review" />
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
                          Chấp nhận gợi ý
                        </Button>
                      </form>
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Gán thủ công
                    </Label>
                    <JarManualReviewForm
                      reviewId={review.id}
                      amount={review.amount}
                      jars={data.items}
                      returnTo="/jars/review"
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
