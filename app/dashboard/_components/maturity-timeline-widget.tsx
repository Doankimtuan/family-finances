"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVndCompact } from "@/lib/dashboard/format";
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

  if (query.isLoading) return null;
  if (query.isError || !query.data?.nextMaturity) {
    return (
      <EmptyState
        icon={BellRing}
        title={t("savings.widget.empty.title")}
        description={t("savings.widget.empty.description")}
      />
    );
  }

  const next = query.data.nextMaturity;
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-slate-900">
          {t("savings.widget.title")}
        </h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{next.providerName}</p>
          <p className="mt-1 text-xs text-slate-500">{next.maturityDate}</p>
          <p className="mt-3 text-lg font-bold text-amber-800">
            {formatVndCompact(next.grossValue, locale)}
          </p>
        </div>
        <Link href={`/money/savings/${next.id}`} className="text-sm font-medium text-primary hover:underline">
          {t("savings.widget.open_detail")}
        </Link>
      </CardContent>
    </Card>
  );
}
