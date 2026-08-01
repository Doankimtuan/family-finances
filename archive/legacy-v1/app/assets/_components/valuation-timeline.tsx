"use client";

import { formatVnd } from "@/lib/dashboard/format";
import { formatDate, formatNumber } from "@/lib/dashboard/format";
import type { ValuationPoint } from "@/lib/assets/timeline";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";

type ValuationTimelineProps = {
  data: ValuationPoint[];
};

export function ValuationTimeline({ data }: ValuationTimelineProps) {
  const { locale, t } = useI18n();

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {t("assets.no_valuation_timeline")}
      </div>
    );
  }

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-semibold text-slate-800">
          {t("assets.valuation_timeline")}
        </p>

        <div className="flex h-36 items-end gap-2 overflow-x-auto">
          {data.map((point) => {
            const ratio = Math.max(point.value / max, 0.06);
            return (
              <div
                key={point.date}
                className="flex min-w-[44px] flex-col items-center gap-2"
              >
                <div
                  className="w-8 rounded-t-md bg-indigo-600"
                  style={{ height: `${Math.round(ratio * 100)}%` }}
                  title={`${formatDate(point.date, locale)}: ${formatVnd(point.value, locale)}`}
                />
                <span className="text-[10px] text-slate-500">
                  {formatDate(point.date, locale, { month: "short" })}
                </span>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("common.date")}
                </th>
                <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("assets.quantity")}
                </th>
                <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("assets.unit_price")}
                </th>
                <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {t("assets.value")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr
                  key={point.date}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {formatDate(point.date, locale)}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {formatNumber(point.quantity, locale)}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">
                    {formatVnd(point.unitPrice, locale)}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-slate-900">
                    {formatVnd(point.value, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
