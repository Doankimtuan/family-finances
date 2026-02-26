"use client";

import { formatVnd } from "@/lib/dashboard/format";
import { formatDate, formatNumber } from "@/lib/dashboard/format";
import type { ValuationPoint } from "@/lib/assets/timeline";
import { useI18n } from "@/lib/providers/i18n-provider";

type ValuationTimelineProps = {
  data: ValuationPoint[];
};

export function ValuationTimeline({ data }: ValuationTimelineProps) {
  const { locale, language } = useI18n();
  const vi = language === "vi";

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {vi ? "Chưa có dòng thời gian định giá. Hãy thêm mốc số lượng và đơn giá để xem xu hướng." : "No valuation timeline yet. Add quantity and price snapshots to see trend."}
      </div>
    );
  }

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">{vi ? "Dòng thời gian định giá" : "Valuation Timeline"}</p>

      <div className="flex h-36 items-end gap-2 overflow-x-auto">
        {data.map((point) => {
          const ratio = Math.max(point.value / max, 0.06);
          return (
            <div key={point.date} className="flex min-w-[44px] flex-col items-center gap-2">
              <div
                className="w-8 rounded-t-md bg-indigo-600"
                style={{ height: `${Math.round(ratio * 100)}%` }}
                title={`${formatDate(point.date, locale)}: ${formatVnd(point.value, locale)}`}
              />
              <span className="text-[10px] text-slate-500">{formatDate(point.date, locale, { month: "short" })}</span>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Ngày" : "Date"}</th>
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Số lượng" : "Quantity"}</th>
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Đơn giá" : "Unit Price"}</th>
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">{vi ? "Giá trị" : "Value"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date} className="border-b border-slate-100 last:border-b-0">
                <td className="px-3 py-2 text-sm text-slate-700">{formatDate(point.date, locale)}</td>
                <td className="px-3 py-2 text-sm text-slate-700">{formatNumber(point.quantity, locale)}</td>
                <td className="px-3 py-2 text-sm text-slate-700">{formatVnd(point.unitPrice, locale)}</td>
                <td className="px-3 py-2 text-sm font-medium text-slate-900">{formatVnd(point.value, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
