"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatVndCompact } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";

type Payload = {
  totalGrossValue: number;
  nextMaturity: { id: string; providerName: string; maturityDate: string; grossValue: number } | null;
  upcomingCount30d: number;
};

export function MaturityTimelineWidget() {
  const { locale, t } = useI18n();
  const query = useQuery<Payload>({
    queryKey: ["savings-summary-widget"],
    queryFn: async () => {
      const response = await fetch("/api/savings/summary");
      if (!response.ok) throw new Error(t("savings.widget.load_error"));
      return (await response.json()) as Payload;
    },
    staleTime: 60_000,
  });

  if (query.isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    );
  }
  if (query.isError || !query.data?.nextMaturity) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-4">
          <EmptyState
            icon={BellRing}
            title={t("savings.widget.empty.title")}
            description={t("savings.widget.empty.description")}
            className="min-h-[220px] border-0 bg-transparent p-0"
          />
        </CardContent>
      </Card>
    );
  }

  const next = query.data.nextMaturity;
  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-1 pb-2">
        <h3 className="text-lg font-semibold text-foreground">
          {t("savings.widget.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {query.data.upcomingCount30d > 1
            ? `${query.data.upcomingCount30d} ${t("savings.summary.deposits")}`
            : formatDate(next.maturityDate, locale)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm font-semibold text-foreground">{next.providerName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(next.maturityDate, locale)}
          </p>
          <p className="mt-3 text-lg font-bold text-warning">
            {formatVndCompact(next.grossValue, locale)}
          </p>
        </div>
        <Link
          href={`/money/savings/${next.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("savings.widget.open_detail")}
        </Link>
      </CardContent>
    </Card>
  );
}
